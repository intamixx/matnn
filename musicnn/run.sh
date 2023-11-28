#!/bin/bash
#
# Analyse an audio file and add BPM metadata
#

#set -e

usage()
{
	cat <<END
run.sh v1

Usage: run.sh [options]
Wrapper script to run matnn jobs

  -f   filename of song
  -t   tags required
  -h   Display this help message and exit

END
}

# Parse command line arguments


while getopts "h:f:t:" OPT; do
	case "$OPT" in
	f)
		ARGS=$OPTARG
		filename=$ARGS
		;;
	t)
		ARGS=$OPTARG
		tags=$ARGS
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
echo "TAGS required - $tags"

#PATHNAME="$1"
#shift

echo "--------------"
echo "- Run Script -"
echo "--------------"

#echo "Working Directory $PATHNAME"; echo

# Check the tags list to see what type of job(s) to run

tagselection=($tags)

BASEDIR=$(dirname "${filename}")
echo ${filename}
echo ${BASEDIR}
for value in "${tagselection[@]}"
do
	case $value in
	genre)
		echo "Genre tag required"
		cmdstr="python3 -m musicnn.tagger '${filename}' --model MSD_musicnn --topN 3 --length 3 --overlap 1 --print --save '${filename}.genre'"
		bash -c "${cmdstr}"
		;;
	bpm)
		echo "Bpm tag required"
		cmdstr="python3 /musicnn/bpm.py -f '${filename}'"
		BPM=`bash -c "${cmdstr}"`
	 	BPMROUND=`printf "%.1f\n" "$BPM"`
		echo "BPM is $BPMROUND"
		echo "$BPMROUND" | tee -a "${filename}.bpm"

		;;
	key)
		echo "Key tag required"
		#TODO
		;;
	*)
		echo "Default"
		;;
	esac
done
exit
