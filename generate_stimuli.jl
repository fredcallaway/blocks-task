model_dir = "../blocks-model"
include("$model_dir/utils.jl")
include("$model_dir/experiment.jl")
include("$model_dir/data.jl")

using Combinatorics
using JSON

version = "v7.0"
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
    stim = (; name, target = mat2string(mask(shape)), solution = flat_pieces(shape))
    stim.name => stim
    # target, offset1, offset2 = attach(n1, n2)
    # target = mat2string(target)
    # name => (;name, target)
end |> Dict



write("static/json/all_stimuli.json", json((;basic, compositions)))


mkpath("$model_dir/stimuli/")
map(permutations(pnames, 2)) do (n1, n2)
    name = string(n1, "-", n2)
    shape = attach(attach(primitives[n1], pink), primitives[n2])
    name => shape
end |> Dict |> serialize("$model_dir/stimuli/$version")

# %% --------

COLOR_INDEX = Dict(
  "#e41a1c" => 1,
  "#377eb8" => 2,
  "#4daf4a" => 3,
  "#984ea3" => 4,
  "#ff7f00" => 5,
  "#FFEF33" => 6,
  "#f781bf" => 7,
  "#a65628" => 8,
)

# shp = all_solutions[1][2]

# %% --------


function generate_main(i::Int)
    rng = Random.MersenneTwister(i)
    prim = shuffle(rng, pnames)
    trials = map(eachindex(prim)) do i
        cn = string(prim[i], "-", prim[mod1(i+1, length(prim))])
        compositions[cn]
    end
    shuffle!(rng, trials)
end


if generation == 1
    foreach(0:19) do i
        stimuli = (
            examples = [],
            main = generate_main(i),
            generation = 1,
        )
        write("static/json/$i.json", json(stimuli))
    end
elseif generation > 1
    uids = @chain begin
        load_participants(version)
        @rsubset begin
            :complete
            :generation === (generation - 1)
        end
        @with :uid
    end

    @assert length(uids) ≥ 14
    @show length(uids)

    all_solutions = flatmap(uids) do uid
        trials = filter(!get(:practice), load_trials(uid))
        map(trials) do t
            @assuming t.configuration t.puzzle => parse_solution(t.configuration)
        end |> skipmissing |> collect
    end;
    @show length(all_solutions)

    n_primitive = length(primitives)
    n_example = 8
    n_main = 4

    cnames = collect(keys(compositions))

    function generate_stimuli(i::Int)
        Random.seed!(i)

        chosen = sample(all_solutions, n_example; replace=false)

        # unique!(e->color_map(e[2]), chosen)
        # @infiltrate length(unique(e->color_map(e[2]), chosen)) != length(chosen)
        # @assert length(unique(e->color_map(e[2]), chosen)) == length(chosen)

        examples = map(chosen) do (name, solution)
            (;compositions[name]...,
              solution = flat_pieces(solution)
            )
        end
        unseen = shuffle(setdiff(cnames, get.(examples, :name)))

        main = map(unseen[1:4]) do name
            compositions[name]
        end

        (;main, examples, generation)
    end

    foreach(0:19) do i
        stimuli = generate_stimuli(generation * 1000 + i)
        write("static/json/$i.json", json(stimuli))
    end

    println("wrote static/json/ for generation $generation")
end
