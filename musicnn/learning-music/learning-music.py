#!/usr/bin/python3

from pathlib import Path
import tempfile

from cog import BasePredictor, Input, Path
from essentia.streaming import (
    MonoLoader,
    FrameCutter,
    VectorRealToTensor,
    TensorToPool,
    TensorflowInputMusiCNN,
    TensorflowInputVGGish,
    TensorflowPredict,
    PoolToTensor,
    TensorToVectorReal,
)
from essentia import Pool, run
import numpy as np

from models import models

import os, sys, getopt, re

def predict(audio_file):
    """Load the model into memory to make running multiple predictions efficient"""
    sample_rate = 16000
    model_type: str = Input(
        description="Model type (embeddings)",
        default="musicnn-msd-2",
        choices=["musicnn-msd-2", "musicnn-mtt-2", "vggish-audioset-1"],
    )
    # Configure a processing chain based on the selected model type.
    pool = Pool()
    loader = MonoLoader(filename=str(audio_file), sampleRate=sample_rate)

    patch_hop_size = 0  # No overlap for efficiency
    batch_size = 256

    model_type="musicnn-msd-2"

    if model_type in ["musicnn-msd-2", "musicnn-mtt-2"]:
        frame_size = 512
        hop_size = 256
        patch_size = 187
        nbands = 96
        melSpectrogram = TensorflowInputMusiCNN()
    elif model_type in ["vggish-audioset-1"]:
        frame_size = 400
        hop_size = 160
        patch_size = 96
        nbands = 64
        melSpectrogram = TensorflowInputVGGish()

    frameCutter = FrameCutter(
        frameSize=frame_size,
        hopSize=hop_size,
        silentFrames="keep",
    )
    vectorRealToTensor = VectorRealToTensor(
        shape=[batch_size, 1, patch_size, nbands],
        patchHopSize=patch_hop_size,
    )
    tensorToPool = TensorToPool(namespace="model/Placeholder")

    # Algorithms for specific models.
    tensorflowPredict = {}
    poolToTensor = {}
    tensorToVectorReal = {}

    for model in models:
        modelFilename = "models/%s-%s.pb" % (model["name"], model_type)
        tensorflowPredict[model["name"]] = TensorflowPredict(
            graphFilename=modelFilename,
            inputs=["model/Placeholder"],
            outputs=["model/Sigmoid"],
        )
        poolToTensor[model["name"]] = PoolToTensor(namespace="model/Sigmoid")
        tensorToVectorReal[model["name"]] = TensorToVectorReal()

    loader.audio >> frameCutter.signal
    frameCutter.frame >> melSpectrogram.frame
    melSpectrogram.bands >> vectorRealToTensor.frame
    vectorRealToTensor.tensor >> tensorToPool.tensor

    for model in [model["name"] for model in models]:
        tensorToPool.pool >> tensorflowPredict[model].poolIn
        tensorflowPredict[model].poolOut >> poolToTensor[model].pool
        (poolToTensor[model].tensor >> tensorToVectorReal[model].tensor)
        tensorToVectorReal[model].frame >> (pool, "activations.%s" % model)

    print("running the inference network...")
    run(loader)

    title = audio_file
    title = "# %s\n" % title
    header = "| model | class | activation |\n"
    bar = "|---|---|---|\n"
    table = title + header + bar
    for model in models:
        average = np.mean(pool["activations.%s" % model["name"]], axis=0)

        labels = []
        activations = []

        top_class = np.argmax(average)
        for i, label in enumerate(model["labels"]):
            labels.append(label)
            if i == top_class:
                activations.append(f"**{average[i]:.2f}**")
            else:
                activations.append(f"{average[i]:.2f}")

        labels = "<br>".join(labels)
        activations = "<br>".join(activations)

        table += f"{model['name']} | {labels} | {activations}\n"
        if model != models[-1]:
            table += "||<hr>|<hr>|\n"  # separator for readability

    out_path = Path(tempfile.mkdtemp()) / "out.md"
    with open(out_path, "w") as f:
        f.write(table)
    return out_path

def main(argv):
    file = ''
    try:
        opts, args = getopt.getopt(argv,"h:f:",["help=", "file="])
    except getopt.GetoptError:
        print(('%s -f <file>') % format(os.path.abspath(__file__)))
        sys.exit(2)
    for opt, arg in opts:
        if opt == '-h':
            print(('%s -f <file>') % format(os.path.abspath(__file__)))
            sys.exit(2)
        elif opt in ("-f", "--file"):
            file = arg
    if not file:
        print(('%s -f <file>') % format(os.path.abspath(__file__)))
        sys.exit(2)
    result = predict(file)
    print (result)
    if not result:
        print ("No suitable genre found")
        sys.exit(2)

if __name__ == '__main__':
    main(sys.argv[1:])
