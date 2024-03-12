model_dir = "../blocks-model/"
include("$model_dir/utils.jl")
include("$model_dir/experiment.jl")
include("$model_dir/data.jl")

using Combinatorics
using JSON

generation = 0
if !@isdefined(generation)
    generation = parse(Int, ARGS[1])
end

TARGET_BORDER = 10

# %% --------

function load_primitives(file="primitives.jsonl")
    primitives = map(readlines(file)) do line
        startswith(line, "#") && return missing
        stim = JSON.parse(line)
        shape = parse_solution(stim["solution"])
        @assert shape.mask == string2mat(stim["target"])
        stim["name"] => shape
    end |> skipmissing |> Dict
end

# function get_offset(blocks, dim)
#     minimum(blocks) do block
#         block[dim] + minimum(block["parts"]) do p
#             p[dim]
#         end
#     end
# end

primitives = load_primitives()
pnames = collect(keys(primitives))

# filter!(primitives) do x
#     first(x) in pnames
# end

# %% --------

s1 = primitives["dude"]
s2 = primitives["spaceship"]
compose(s1, s2)

function border_size(X)
    sum(CartesianIndices(X)) do idx
        y, x = idx.I
        if X[y, x] > 0
            sum(((y+1, x), (y-1, x), (y, x+1), (y, x-1))) do neighbor
                get(X, neighbor, 0) > X[y, x]
            end
        else
            0
        end
    end
end

function attach(s1, s2; target_border=TARGET_BORDER)
    h1, w1 = size(s1)
    h2, w2 = size(s2)

    argmin(Iterators.product(-h2:h1,w1-1:w1+1)) do (off_y, off_x)
        shape = compose((PlacedPiece(s1, 0, 0), PlacedPiece(s2, off_y, off_x)))
        ismissing(shape) && return -Inf
        abs(border_size(shape.mask) - target_border)
    end
end


# %% --------

function is_overlapping(X, Y)
    @assert size(X) == size(Y)
    any(eachindex(X)) do i
        X[i] > 0 && Y[i] > 0
    end
end


function plot_stim(X; zlim=(0,max(2, maximum(X))), kws...)
    heatmap(X, border=:none, labels=false, yflip=true; zlim, kws...)
end

PINK =  Dict("x" => 0, "y" => 0, "color" => "#f781bf", "width" => 1, "height" => 4, "parts" => Any[Dict{String, Any}("x" => 0, "y" => 0), Dict{String, Any}("x" => 0, "y" => 1), Dict{String, Any}("x" => 0, "y" => 2), Dict{String, Any}("x" => 0, "y" => 3)])


# %% --------


function attach(s1, s2; target_border=TARGET_BORDER)
    h1, w1 = size(s1)
    h2, w2 = size(s2)
    X = zeros(Int, h1+2h2, w1+w2+1)
    X[1+h2:h2+h1, 1:w1] .= s1
    indices = collect(Iterators.product(1:h1+h2, w1-1:w1+1))[:]
    options = map(indices) do (y, x)
        # horizontal_offset = x - w1 - 1
        is_overlapping(X[y:y+h2-1, x:x+w2-1], s2) && return missing
        X1 = copy(X)
        X1[y:y+h2-1, x:x+w2-1] .= ((maximum(s1) + 1) .* s2)

        # trim
        t = findfirst(x -> any(x .> 0), eachrow(X1))
        b = findlast(x -> any(x .> 0), eachrow(X1))
        r = findlast(x -> any(x .> 0), eachcol(X1))
        X1 = X1[t:b, 1:r]

        # @show h2 - t + 1
        offset1 = (;
            y = h2 - t + 1,
            x = 0
        )
        offset2 = (;
            y = y - t,
            x = x -1
        )

        (X1, offset1, offset2)
    end
    (X, offset1, offset2) = argmin(skipmissing(options)) do (X, offset1, offset2)
        border_err = abs(border_size(X) - target_border)
        border_err +  0.1 * size(X, 1)
    end
    # display(plot_stim(X))
    (X, offset1, offset2)
end

targets = valmap(primitives) do stim
    string2mat(stim["target"])
end

pink = trues(4, 1)


X, offset1, offset2 = attach(targets["4by5"], pink)
plot_stim(X)

attach(X, targets["spaceship"])[1] |> plot_stim




# %% --------

attach("tower", "dude"; plot=true);

puzzles = map(permutations(pnames, 2)) do (n1, n2)
    stim = attach(n1, n2)
    stim.name => stim
    # target, offset1, offset2 = attach(n1, n2)
    # target = mat2string(target)
    # name = string(n1, "-", n2)
    # name => (;name, target)
end |> Dict

write("static/json/all_stimuli.json", json((;basic=primitives, compositions=puzzles)))


# %% --------

function generate_main(i::Int)
    Random.seed!(i)
    prim = shuffle(pnames)
    map(eachindex(prim)) do i
        cn = string(prim[i], "-", prim[mod1(i+1, length(prim))])
        puzzles[cn]
    end |> shuffle!
end

if generation == 1
    mkpath("static/json/gen1/")
    foreach(0:19) do i
        write("static/json/gen1/$i.json", json(generate_stimuli(i)))
    end
elseif generation > 1

    uids = (@rsubset load_participants("v5.0-g$(generation-1)") :complete).uid

    @assert length(uids) == 15

    all_trials = flatmap(uids) do uid
        trials = filter(!get(:practice), load_trials(uid))
        map(trials) do t
            @assuming t.configuration t.puzzle => t.configuration
        end |> skipmissing |> collect
    end;


    choices = repeatedly(10000) do
        sample(all_trials, 5, replace=false)
    end;

    function score(examples)
        n1, n2 = Set.(invert(split.(first.(examples), "-")))
        length(union(n1, n2)) == 5 || return -1
        sum(length, (n1, n2))
    end

    score10 = filter(choices) do c
        score(c) == 10
    end;

    @assert length(score10) ≥ 20

    function sample_main(examples::Vector)
        used = first.(examples)
        for i in rand(1:100000, 1000)
            main = generate_stimuli(i).main
            !any(in(used), first.(main)) && return main
        end
        error("couldn't sample main")
    end

    function generate_stimuli(i::Int, examples::Vector)
        Random.seed!(i)
        main = sample_main(examples)
        @assert isempty(intersect(first.(main), first.(examples)))
        examples = map(examples) do (name, solution)
            (;puzzles[name]...,
            solution = apply_offset(solution, (;x=0, y=0)))
        end
        (;main, examples)
        # (;main, examples)
    end

    mkpath("static/json/gen$generation/")
    foreach(0:19) do i
        stimuli = generate_stimuli(i, score10[i+1])
        write("static/json/gen$generation/$i.json", json(stimuli))
    end
    println("wrote static/json/gen$generation/")
end
