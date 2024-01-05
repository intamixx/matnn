#!/usr/bin/python3

import tempfile

from cog import BasePredictor, Input, Path
from essentia.standard import MonoLoader, TensorflowPredictEffnetDiscogs, TensorflowPredict2D
import numpy as np

from models import models

import os, sys, getopt, re

MODELS_HOME = Path("models")


def initialize_table(model_type: str, title: str):
    if model_type == "regression":
        title = "# %s\n" % title
        header = "| model | value |\n"
        bar = "|---|---|\n"
        table = title + header + bar
    else:
        title = "# %s\n" % title
        header = "| model | class | activation |\n"
        bar = "|---|---|---|\n"
        table = title + header + bar
    return table

def predict(audio_file):
    global tensorflowPredictEffnetDiscogs
    model_type: str = Input(
        description="Regards to the downstream type: 2class, 3class, regression",
        default= "regression",
        choices=["regression", "2 classes", "3 classes"]
    ),
    """Load the model into memory and create the Essentia network for predictions"""

    #model = str(MODELS_HOME / "discogs-effnet-bs64-1.pb")
    model = str("discogs-effnet-bs64-1.pb")
    #print (model)
    input = "model/Placeholder"
    output = "model/Softmax"
    sample_rate = 16000

    loader = MonoLoader()
    tensorflowPredictEffnetDiscogs = TensorflowPredictEffnetDiscogs(
        graphFilename=model,
        output="PartitionedCall:1",
        patchHopSize=128,
    )

    # Algorithms for specific models.
    global classifiers
    classifiers = {}
    # get model_types from dict keys
    global model_types
    model_types = models.keys()
    #print(f"model_types: {model_types}")
    # load all models in classifiers for all model_types
    all_models = [models[model_type][key] for model_type in model_types for key in models[model_type].keys()]
    # build a dict of dicts to handle classifiers for each model type
    for model in all_models:
        #print ("---------------")
        #print (model)
        #modelFilename = str(MODELS_HOME / f"{model['name']}.pb")
        modelFilename = str(f"{model['name']}.pb")
        #print (modelFilename)
        classifiers[model["name"]] = TensorflowPredict2D(
            graphFilename=modelFilename,
            input=input,
            output="model/Identity" if "regression" in model["name"] else output,
        )


    #print("loading audio...")
    loader.configure(sampleRate=sample_rate, filename=str(audio_file), resampleQuality=4)
    waveform = loader()

    #print ("MODEL TYPE ;;;;;;;;;;;;;;;;;;;")
    #model_type = "regression"
    #model_type = "2 classes"
    model_type = "3 classes"
    #print (model_type)
    table = _run_models(waveform, model_type, audio_file)

    #out_path = Path(tempfile.mkdtemp()) / "out.md"
    #with open(out_path, "w") as f:
    #    f.write(table)

    #print("done!")
    #return out_path
    return

def _run_models(waveform: np.ndarray, model_type: str, title: str):
    embeddings = tensorflowPredictEffnetDiscogs(waveform)

    # the header and bar table should change for a regression model
    table = initialize_table(model_type, title)
    model_list = []
    ae = {}

    # define a list of models for the model_type
    #for key in models[model_type].keys():
    #    print (key)
    #    print (models[model_type][key])
    model_list = [models[model_type][key] for key in models[model_type].keys()]
    #print (model_list)

    #print("running classification heads...")
    if model_type == "regression":
        # predict with each regression model
        for model in model_list:
            print (model)
            results = classifiers[model["name"]](embeddings)
            average = np.mean(results.squeeze(), axis=0)
            std = np.std(results.squeeze(), axis=0)

            value = f"{average:.2f}±{std:.2f}"

            table += f"{model['name']} | {value}\n"
            if model != model_list[-1]:
                table += "|||\n"  # separator for readability
    else:
        # predict with each classification model
        for model in model_list:
            results = classifiers[model["name"]](embeddings)
            average = np.mean(results.squeeze(), axis=0)

            labels = []
            activations = []

            top_class = np.argmax(average)
            for i, label in enumerate(model["labels"]):
                labels.append(label)
                #print (label)
                #print (f"{average[i]:.2f}")
                if i == top_class:
                    activations.append(f"**{average[i]:.2f}**")
                    #print (f"{model['friendly_name']}: {label}")
                    ae[model['friendly_name']]=label
                else:
                    activations.append(f"{average[i]:.2f}")

            labels = "<br>".join(labels)
            activations = "<br>".join(activations)

            table += f"{model['name']} | {labels} | {activations}\n"
            if model != model_list[-1]:
                table += "||||\n"  # separator for readability
        print (ae)
    return table

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
    #print (result)
    #if not result:
    #    print ("No suitable genre found")
    #    sys.exit(2)

if __name__ == '__main__':
    main(sys.argv[1:])
