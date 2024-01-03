#!/usr/bin/python3

import json
import tempfile
from itertools import chain
from pathlib import Path
from textwrap import wrap

import numpy as np
import matplotlib.pyplot as plt
import pandas
import seaborn as sns
from cog import BasePredictor, Input, Path
from essentia.standard import (
            MonoLoader,
            TensorflowPredictMAEST,
#            TensorflowPredict2D,
            )

from labels import labels
import os, sys, getopt, re

def process_labels(label):
    genre, style = label.split("---")
    return f"{style}\n({genre})"

processed_labels = list(map(process_labels, labels))

def predict(audio_file):
    """Load the model into memory and create the Essentia network for predictions"""
    embedding_model_file = "discogs-maest-30s-pw-1.pb"
    output = "activations"
    sample_rate = 16000
    top_n = 10

    loader = MonoLoader()
    print("attempting to load MAEST")
    tensorflowPredictMAEST = TensorflowPredictMAEST(
        graphFilename=embedding_model_file, output="StatefulPartitionedCall:0"
    )
    print("loaded MAEST")

    print("loading audio...")
    loader.configure(
        sampleRate=sample_rate,
        resampleQuality=4,
        filename=str(audio_file),
    )
    waveform = loader()

    print("running the model...")
    activations = tensorflowPredictMAEST(waveform)
    activations = np.squeeze(activations)
    if len(activations.shape) == 2:
        activations_mean = np.mean(activations, axis=0)
    else:
        activations_mean = activations

    out_path = Path(tempfile.mkdtemp()) / "out.json"
    with open(out_path, "w") as f:
        json.dump(dict(zip(labels, activations_mean.tolist())), f)
    #return out_path

    print("plotting...")
    top_n_idx = np.argsort(activations_mean)[::-1][:top_n]

    result = {
        "label": list(
            chain(
                *[
                    [processed_labels[idx]] * activations.shape[0]
                    for idx in top_n_idx
                ]
            )
        ),
        "activation": list(chain(*[activations[:, idx] for idx in top_n_idx])),
    }
    print (result)
    result = pandas.DataFrame.from_dict(result)
    print ("------------------")
    print (result)
    print (type(result))

    genre_array = []

    df = pandas.DataFrame(result)
    for row in df.itertuples(name='result'):
        #print(row)
        myrow = row
        #print (type(myrow))
        #print (myrow)
        #print ("genre:", myrow.label)
        genre = myrow.label.replace('\n', ' ')
        #print ("Genre:", genre)
        genre = re.sub("[\(\[].*?[\)\]]", "", genre)
        genre = genre.rstrip()
        if genre not in genre_array:
                genre_array.append(genre)
    genre = ','.join(genre_array[:3])
    return genre


    # Wrap title to lines of approximately 50 chars.
    title = wrap(title, width=50)

    # Allow a maximum of 2 lines of title.
    if len(title) > 2:
        title = title[:2]
        title[-1] += "..."

    title = "\n".join(title)

    g = sns.catplot(
        data=result,
        kind="bar",
        y="label",
        x="activation",
        color="#abc9ea",
        alpha=0.8,
        height=6,
    )
    g.set(xlabel=None)
    g.set(ylabel=None)
    g.set(title=title)
    g.set(xlim=(0, 1))

    # Add some margin so that the title is not cut.
    g.fig.subplots_adjust(top=0.90)

    out_path = Path(tempfile.mkdtemp()) / "out.png"
    plt.savefig(out_path)

    # Clean-up.
    if url:
        audio.unlink()

    print("done!")
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
