#!/bin/bash
#
# Wrapper Script to analyse an audio file
#

set -e

usage()
{
	cat <<END
run.sh v1

Usage: run.sh [options]
Wrapper script to run matnn jobs

  -f   filename of song
  -g   genre tag required (musicnn or discogs-effnet)
  -b   bpm tag required
  -k   key tag required
  -h   Display this help message and exit

END
}

# Parse command line arguments

genre=false
bpm=false
key=false

while getopts "h:f:g:bkx" OPT; do
	case "$OPT" in
	f)
		ARGS=$OPTARG
		filename=$ARGS
		;;
	g)
		ARGS=$OPTARG
		genre_model=$ARGS
		genre=true
		;;
	b)
		bpm=true
		;;
	k)
		key=true
		;;
	x)
		blank=true
		;;
	h)
		usage
		exit 0
		;;
	?)
		exit 1
	esac
done
shift $((OPTIND - 1))

if [ -z "$filename" ]; then
	usage >&2
	exit 1
fi

set -u

echo "FILENAME - $filename"
echo "TAGS required - genre bpm key = $genre $bpm $key"

#PATHNAME="$1"
#shift

echo "--------------"
echo "- Run Script -"
echo "--------------"

#echo "Working Directory $PATHNAME"; echo

# Check the tags list to see what type of job(s) to run

BASEDIR=$(dirname "${filename}")
echo ${filename}
echo ${BASEDIR}
if ${genre}; then
	case ${genre_model} in
	musicnn)
		echo "Musicnn Genre tag required"
		cmdstr="python3 -m musicnn.tagger '${filename}' --model MSD_musicnn --topN 3 --length 3 --overlap 1 --print --save '${filename}.genre'"
		bash -c "${cmdstr}"
		;;
	discogs-effnet)
		echo "Discogs-effnet Genre tag required"
		cmdstr="python3 /musicnn/genre-discogs-effnet.py -f '${filename}'"
		GENRE=`bash -c "${cmdstr}"`
		echo "$GENRE" | tee -a "${filename}.genre"
		;;
	esac
fi
if ${bpm}; then
		echo "Bpm tag required"
		cmdstr="python3 /musicnn/bpm.py -f '${filename}'"
		BPM=`bash -c "${cmdstr}"`
	 	BPMROUND=`printf "%.1f\n" "$BPM"`
		echo "BPM is $BPMROUND"
		echo "$BPMROUND" | tee -a "${filename}.bpm"
fi
if ${key}; then
		echo "Key tag required"
		cmdstr="python3 /musicnn/key-scale.py -f '${filename}'"
		KEY_SCALE=`bash -c "${cmdstr}"`
		echo "Key Scale is $KEY_SCALE"
		echo "$KEY_SCALE" | tee -a "${filename}.key"
fi
exit
