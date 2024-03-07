model_dir = "../blocks-model/"
include("$model_dir/utils.jl")
include("$model_dir/blocks.jl")
include("$model_dir/data.jl")

using Combinatorics
using JSON

# %% --------

function string2mat(s)
    mapreduce(vcat, split(strip(s), "\n")) do row
        reshape(collect(strip(row)), 1, :) .== 'X'
    end
end

function mat2string(X)
    rows = map(eachrow(X)) do x
        string(ifelse.(x .> 0, "X", ".")...)
    end
    join(rows, "\n")
end

function load_primitives(file="primitives.jsonl")
    map(readlines(file)) do line
        stim = JSON.parse(line)
        stim["name"] => stim
    end
end

primitives = load_primitives()

filter!(primitives) do x
    first(x) in ["flipper", "moth", "longrect", "skull", "flags"]
end

perms = @chain map(primitives) do (name, stim)
    name, string2mat(stim["target"])
end permutations(2) collect

# %% --------

function is_overlapping(X, Y)
    @assert size(X) == size(Y)
    any(eachindex(X)) do i
        X[i] > 0 && Y[i] > 0
    end
end

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

function attach(s1, s2; target_border=2)
    h1, w1 = size(s1)
    h2, w2 = size(s2)
    X = zeros(Int, h1+2h2, w1+w2)
    X[1+h2:h2+h1, 1:w1] .= s1
    indices = collect(Iterators.product(1:h1+h2, w1-1:w1+1))[:]
    options = map(indices) do (y, x)
        if !is_overlapping(X[y:y+h2-1, x:x+w2-1], s2)
            X1 = copy(X)
            X1[y:y+h2-1, x:x+w2-1] .+= (2 .* s2)
            # trim
            t = findfirst(x -> any(x .> 0), eachrow(X1))
            b = findlast(x -> any(x .> 0), eachrow(X1))
            r = findlast(x -> any(x .> 0), eachcol(X1))
            X1 = X1[t:b, 1:r]
            (X1, t, b, y, x)
        else
            missing
        end
    end
    (X, t, b, y, x) = argmax(skipmissing(options)) do (X, _...)
        # size(X, 1) > 15 && return -100
        -abs(border_size(X) - target_border) - 0.1 * size(X, 1)
        # border_size(X) - 0.1 * size(X, 1)
    end
    offset1 = (;
        y = h2 - t + 1,
        x = 0
    )

    offset2 = (;
        y = y - t,
        x = x - 1
    )
    (;target=X, offset1, offset2)
end

# %% --------

function plot_stim(X; zlim=(0,2), kws...)
    heatmap(X, border=:none, labels=false, yflip=true; zlim, kws...)
end


map(perms) do ((n1, s1), (n2, s2))
    X = attach(s1, s2).target
    plot_stim(X)
end |> gridplot


# %% --------

function get_offset(blocks, dim)
    minimum(blocks) do block
        block[dim] + minimum(block["parts"]) do p
            p[dim]
        end
    end
end


function apply_offset(blocks, offset)
    x = offset.x - get_offset(blocks, "x")
    y = offset.y - get_offset(blocks, "y")
    map(blocks) do block
        block = copy(block)
        block["x"] += x
        block["y"] += y
        block
    end
end

basic_solutions = map(x->x["solution"], Dictionary(Dict(primitives)))

compositions = map(perms) do ((n1, s1), (n2, s2))
    target, offset1, offset2 = attach(s1, s2)
    name = string(n1, "-", n2)
    name => (
        name,
        offset1, offset2,
        target = mat2string(target),
        solution = union(
            apply_offset(basic_solutions[n1], offset1),
            apply_offset(basic_solutions[n2], offset2),
        )
    )
end |> Dict

basic = Dict(primitives)
write("static/json/all_stimuli.json", json((;basic, compositions)))

# %% ==================== iterate ====================

pnames = collect(keys(basic))

compositions = map(perms) do ((n1, s1), (n2, s2))
    target, offset1, offset2 = attach(s1, s2)
    target = mat2string(target)
    name = string(n1, "-", n2)
    name => (;name, target)
end |> Dict

function generate_stimuli(i::Int)
    Random.seed!(i)
    prim = shuffle(pnames)
    main = map(eachindex(prim)) do i
        cn = string(prim[i], "-", prim[mod1(i+1, length(prim))])
        compositions[cn]
    end
    shuffle!(main)
    (;main, examples=[])
end

gen1 = map(generate_stimuli, 1:20)
mkpath("static/json/gen1/")

foreach(0:19) do i
    write("static/json/gen1/$i.json", json(generate_stimuli(i)))
end


# %% --------

generation = 3

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
examples = score10[1];


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
        (;compositions[name]...,
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


# %% --------


  let main = _.shuffle(compositions).filter(name => {
    if (!used.has(name) && !used.has(name.split("-").reverse().join("-"))) {
      used.add(name)
      return true
    }
  })


# map(score10[1:20]) do examples


