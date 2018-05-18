#!/usr/bin/env sh

# Change into script's directory
cd "$(dirname "$0")"

mkdir -p ./temp
set -e

run_vegeta() {
    local PROGRAM_URL=$1
    local PROGRAM_DIR=$2
    local QUERY_NAME=$3
    local RPS=$4
    local DURATION=$5
    local BENCH_STATS_FILE=$6
    local TIMEOUT=$7

    {
    echo "POST $PROGRAM_URL"
    echo "Content-Type: application/json"
    echo "@../testcandidates/$PROGRAM_DIR/queries/$QUERY_NAME.json"
    } > ./temp/temptargets.txt

    mkfileP "$BENCH_STATS_FILE"
    vegeta attack -rate=$RPS -duration=""$DURATION"s" -timeout=""$TIMEOUT"s" -targets=./temp/temptargets.txt | vegeta report > "$BENCH_STATS_FILE"
}

mkfileP() {
    mkdir -p "$(dirname "$1")" || return
    touch "$1"
}

bench_query() {
    local QUERY_PARAMS="$1"
    local BENCH_FOLDER="$2"
    local QUERY_NAME="$(echo "$QUERY_PARAMS" | jq -rc '.query')"
    local RPS_ARRAY="$(echo "$QUERY_PARAMS" | jq -rc '.rps | @tsv')"
    local TIMEOUT="$(echo "$QUERY_PARAMS" | jq -rc '.timeout')"
    local DURATION="$(echo "$QUERY_PARAMS" | jq -rc '.duration')"
    local WARMUP_DURATION="$(echo "$QUERY_PARAMS" | jq -rc '.warmup_duration')"
    for CANDIDATE in $(echo "$QUERY_PARAMS" | jq -rc '.candidates[]'); do



        local PROGRAM_DIR="$(echo $CANDIDATE | jq -rc '.dir')"
        local PROGRAM_URL="$(echo $CANDIDATE | jq -rc '.url')"
        ../testcandidates/$PROGRAM_DIR/start
        mkdir     "../testcandidates/$PROGRAM_DIR/results/$BENCH_FOLDER/"
        cp bench.json "../testcandidates/$PROGRAM_DIR/results/$BENCH_FOLDER/"

        if [ "$WARMUP_DURATION" != "null" ]; then
            echo "----------------- Warmup: $BENCH_NAME -----------------"
            echo ""
            run_vegeta "$PROGRAM_URL" "$PROGRAM_DIR" "$QUERY_NAME" 100 "$WARMUP_DURATION" "temp/tmp.warmup" "$TIMEOUT"
            rm "temp/tmp.warmup"

            # Give the service a moment to recover before the first attack starts
            sleep 15
        fi

        for RPS in $RPS_ARRAY;do

            local BENCH_NAME="$QUERY_NAME $PROGRAM_DIR $PROGRAM_URL "$RPS"Req/s "$DURATION"s $OPEN_CONNS"
            local BENCH_STATS_FILE="../testcandidates/$PROGRAM_DIR/results/$BENCH_FOLDER/$QUERY_NAME-$RPS.txt"
            echo "----------------- Benching: $BENCH_NAME -----------------"
            echo ""
            run_vegeta "$PROGRAM_URL" "$PROGRAM_DIR" "$QUERY_NAME" "$RPS" "$DURATION" "$BENCH_STATS_FILE" "$TIMEOUT"

            # Give the service a moment to recover before the next attack starts
            sleep 15

        done
        ../testcandidates/$PROGRAM_DIR/stop
    done
}

usage() {
    echo "Usage: $0 [query-name]"
}

init() {
    mkdir -p stats
    local BENCH_CONF=""
    if [ -e bench.json ]; then
        BENCH_CONF="$(cat bench.json | jq -c '.')"
    else
        echo "needs bench.json to continue"
    fi

    local QUERY_NAME="$1"
    local BENCH_FOLDER="$(date '+%Y-%m-%d_%H:%M')"

    if [ -n "$QUERY_NAME" ]; then
        local QUERY_PARAMS="$(echo $BENCH_CONF | jq --arg QUERY_NAME "$QUERY_NAME" -rc '.[] | select(.query == $QUERY_NAME)')"
        local

        if [ -n "$QUERY_PARAMS" ]; then
            bench_query "$QUERY_PARAMS" "$BENCH_FOLDER"
        else
            echo "The query $QUERY_NAME is not found in bench.json"
            exit 1
        fi

    else
        for QUERY_PARAMS in $(echo "$BENCH_CONF" | jq -rc '.[]'); do
            bench_query "$QUERY_PARAMS" "$BENCH_FOLDER"
        done
    fi
}

if [ "$#" -gt 1 ]; then
    usage
    exit 1
else
    init "$1"
fi
