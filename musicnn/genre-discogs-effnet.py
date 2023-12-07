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
#import youtube_dl
from cog import BasePredictor, Input, Path
from essentia.standard import (
            MonoLoader,
            TensorflowPredictEffnetDiscogs,
            TensorflowPredict2D,
            )

from labels import labels
import os, sys, getopt, re

def process_labels(label):
    genre, style = label.split("---")
    return f"{style}\n({genre})"

def genre_prediction(audio_file):
    # model and classification: https://essentia.upf.edu/models/feature-extractors/discogs-effnet/
    embedding_model_file = "discogs-effnet-bs64-1.pb"
    classification_model_file = "genre_discogs400-discogs-effnet-1.pb"
    output = "activations"
    sample_rate = 16000
    top_n = 10

    classification_model = TensorflowPredict2D(
        graphFilename=classification_model_file,
        input="serving_default_model_Placeholder",
        output="PartitionedCall:0",
    )

    processed_labels = list(map(process_labels, labels))

    #print (processed_labels)
    audio = MonoLoader(filename=audio_file, sampleRate=16000, resampleQuality=4)()
    embedding_model = TensorflowPredictEffnetDiscogs(graphFilename="discogs-effnet-bs64-1.pb", output="PartitionedCall:1")
    embeddings = embedding_model(audio)
    #print (embeddings)
    activations = classification_model(embeddings)
    activations_mean = np.mean(activations, axis=0)

    #out_path = Path(tempfile.mkdtemp()) / "out.json"
    #out_path = "/tmp/out.json"
    #with open(out_path, "w") as f:
    #   json.dump(dict(zip(labels, activations_mean.tolist())), f)
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
    #print (result)
    result = pandas.DataFrame.from_dict(result)
    #print ("------------------")
    #print (result)
    #print (type(result))

    genre_array = []

    df = pandas.DataFrame(result)
    for row in df.itertuples(name='result'):
        #print(row)
        myrow = row
        #print (type(myrow))
        #print (myrow)
        #print ("genre:", myrow.label)
        genre = myrow.label.replace('\n', ' ')
        print ("Genre:", genre)
        genre = re.sub("[\(\[].*?[\)\]]", "", genre)
        genre = genre.rstrip()
        if genre not in genre_array:
                genre_array.append(genre)
    return genre_array[:3]

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
    result = genre_prediction(file)
    print (result)
    if not result:
        print ("No suitable genre found")
        sys.exit(2)

if __name__ == '__main__':
    main(sys.argv[1:])
