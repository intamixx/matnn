#!/usr/bin/python3

import sys
import getopt
import os
import essentia.standard as es
#from tempfile import TemporaryDirectory

def bpmcalc(file):
    # Loading an audio file.
    audio = es.MonoLoader(filename=file)()

    # Compute BPM.
    bpm = es.PercivalBpmEstimator()(audio)

    #print("BPM:", bpm)
    return bpm

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
    result = bpmcalc(file)
    print (result)
    if not result:
        print ("No suitable bpm found")
        sys.exit(2)

if __name__ == '__main__':
    main(sys.argv[1:])
