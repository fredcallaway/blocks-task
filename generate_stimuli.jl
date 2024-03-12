model_dir = "../blocks-model"
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

function load_primitives(file="../blocks-task/primitives.jsonl")
    map(readlines(file)) do line
        startswith(line, "#") && return missing
        stim = JSON.parse(line)
        shape = parse_solution(stim["solution"])
        @assert mask(shape) == string2mat(stim["target"])
        stim["name"] => shape
    end |> skipmissing |> Dict
end

primitives = load_primitives()
pnames = collect(keys(primitives))

# %% --------

function border_size(s::Shape)
    X = s.piece_map
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

    options = map(Iterators.product(-h2:h1,w1:w1)) do (off_y, off_x)
        shape = compose(place(s1, 0, 0), place(s2, off_y, off_x))
    end |> skipmissing
    argmin(options) do shape
        abs(border_size(shape) - target_border) + .1 * size(shape)[1]
    end
end

# %% --------


flat_pieces(pp::PlacedPiece{<:Union{ExperimentPiece,SimplePiece}}) = [pp]

shift(pp::PlacedPiece, y, x) = PlacedPiece(pp.piece, pp.y + y, pp.x + x)

function flat_pieces(pp::PlacedPiece{<:Shape})
    (;y, x, piece) = pp
    mapreduce(vcat, piece.pieces) do pp
        flat_pieces(shift(pp, y-1, x-1))
    end
end


flat_pieces(shp::Shape) = flat_pieces(place(shp))

function JSON.lower(pp::PlacedPiece)
    X = pp.piece.mask
    parts = map(CartesianIndices(X)) do c
        if X[c]
            (;y = c.I[1] - 1, x = c.I[2] - 1)
        else
            missing
        end
    end |> skipmissing |> collect
    (;pp.x, pp.y, pp.piece.color, parts)
end

# %% --------

basic = map(collect(primitives)) do (name, shape)
    stim = (; name, target = mat2string(mask(shape)), solution = flat_pieces(shape) )
    stim.name => stim
end |> Dict

pink = ExperimentPiece(trues(4, 1), "#f781bf")
compositions = map(permutations(pnames, 2)) do (n1, n2)
    name = string(n1, "-", n2)
    shape = attach(attach(primitives[n1], pink), primitives[n2])
    stim = (; name, target = mat2string(mask(shape)), solution = flat_pieces(shape) )
    stim.name => stim
    # target, offset1, offset2 = attach(n1, n2)
    # target = mat2string(target)
    # name => (;name, target)
end |> Dict


write("static/json/all_stimuli.json", json((;basic, compositions)))

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
