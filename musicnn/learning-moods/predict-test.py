#!/usr/bin/python3

# Prediction interface for Cog ⚙️
# Reference: https://github.com/replicate/cog/blob/main/docs/python.md

import os
from dataclasses import dataclass
from typing import Dict, List
import tempfile
from pathlib import Path

import cog

from essentia.standard import MonoLoader, TensorflowPredictMusiCNN, TensorflowPredictVGGish
import numpy as np

import os, sys, getopt, re

MODELS_HOME = "models/"
global moods_dict
moods_dict = {}
global moods_list
moods_list = []

@dataclass
class Model:
    name: str
    labels: List[str]
    model_files: Dict[str, str]

def predict_single_model(audio: str, model: Model):
    """Load the model into memory to make running multiple predictions efficient"""
    sr = 16000
    audio = MonoLoader(filename=str(audio), sampleRate=sr)()

    all_results = {}
    for name, file in model.model_files.items():
        if 'musicnn' in name.lower():
            classifier = TensorflowPredictMusiCNN(graphFilename=os.path.join(MODELS_HOME, file))
        elif 'vggish' in name.lower():
            classifier = TensorflowPredictVGGish(graphFilename=os.path.join(MODELS_HOME, file))
        else:
            classifier = None
        if not classifier:
            raise Exception("Unknown classifier")

        results = classifier(audio)
        averaged_predictions = np.mean(results, axis=0)
        all_results[name] = averaged_predictions

    result_order = list(all_results.keys())
    header = "|  | " + " | ".join(result_order)
    bar = "|---|" + "|".join(["---"] * len(all_results.keys()))
    table = header + "\n" + bar + "\n"
    for i, label in enumerate(model.labels):
        line = f"{label} | "
        for classifier in result_order:
            line += f" {all_results[classifier][i]:.2f} | "
            print (label)
            score = (f"{all_results[classifier][i]:.2f}")
            score = float(score)
            if ( score >= 0.80 ):
                moods_dict[label]=score
        table += line + "\n"
    print ("------------")
    print (moods_dict)
    moods_array = list(moods_dict.keys())
    print (moods_array)
    return table

#@cog.input("audio", type=cog.Path, help="Audio file to process")
def predict(audio):

    models = [
        Model(name="Mood Acoustic", labels=["Acoustic", "Electronic"],
            model_files={'MusiCNN MSD': 'mood_acoustic-musicnn-msd-2.pb'}),
                         #'MusiCNN MTT': 'mood_acoustic-musicnn-mtt-2.pb', 
                         #'VGGish': 'mood_acoustic-vggish-audioset-1.pb'}),
        Model(name="Mood Electronic", labels=["Electronic", "Acoustic"],
                model_files={'MusiCNN MSD': 'mood_electronic-musicnn-msd-2.pb'}),
                            #'MusiCNN MTT': 'mood_electronic-musicnn-mtt-2.pb', 
                            #'VGGish': 'mood_electronic-vggish-audioset-1.pb'}),
        Model(name="Mood Aggressive", labels=["Aggressive", "Friendly"],
            model_files={'MusiCNN MSD': 'mood_aggressive-musicnn-msd-2.pb'}),
                            #'MusiCNN MTT': 'mood_aggressive-musicnn-mtt-2.pb', 
                            #'VGGish': 'mood_aggressive-vggish-audioset-1.pb'}),
        Model(name="Mood Relaxed", labels=["Not relaxed", "Relaxed"],
            model_files={'MusiCNN MSD': 'mood_relaxed-musicnn-msd-2.pb'}),
                            #'MusiCNN MTT': 'mood_relaxed-musicnn-mtt-2.pb', 
                            #'VGGish': 'mood_relaxed-vggish-audioset-1.pb'}),
        Model(name="Mood Happy", labels=["Happy", "Sad"],
            model_files={'MusiCNN MSD': 'mood_happy-musicnn-msd-2.pb'}),
                            #'MusiCNN MTT': 'mood_happy-musicnn-mtt-2.pb', 
                            #'VGGish': 'mood_happy-vggish-audioset-1.pb'}),
        Model(name="Mood Sad", labels=["Happy", "Sad"],
            model_files={'MusiCNN MSD': 'mood_sad-musicnn-msd-2.pb'}),
                            #'MusiCNN MTT': 'mood_sad-musicnn-mtt-2.pb',
                          #'VGGish': 'mood_sad-vggish-audioset-1.pb'}),
        Model(name="Mood Party", labels=["Not party", "Party"],
            model_files={'MusiCNN MSD': 'mood_party-musicnn-msd-2.pb'}),
                            #'MusiCNN MTT': 'mood_party-musicnn-mtt-2.pb',
                          #'VGGish': 'mood_party-vggish-audioset-1.pb'})
        Model(name="Mood Danceability", labels=["Danceable", "Not Danceable"],
            model_files={'MusiCNN MSD': 'danceability-musicnn-msd-2.pb'}),
        Model(name="Mood Gender", labels=["Female", "Male"],
            model_files={'MusiCNN MSD': 'gender-musicnn-msd-2.pb'}),
        Model(name="Mood Tonal/Atonal", labels=["Tonal", "Atonal"],
            model_files={'MusiCNN MSD': 'tonal_atonal-musicnn-msd-2.pb'}),
        Model(name="Mood Voice", labels=["Instrumental", "Voice"],
            model_files={'MusiCNN MSD': 'voice_instrumental-musicnn-msd-2.pb'}),
    ]

    results = ""
    for model in models:
        results += f"# {model.name}\n\n"
        model_table = predict_single_model(audio, model)
        results += model_table + "\n\n"

    out_path = Path(tempfile.mkdtemp()) / "out.md"
    with open(out_path, "w") as f:
        f.write(results)
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
