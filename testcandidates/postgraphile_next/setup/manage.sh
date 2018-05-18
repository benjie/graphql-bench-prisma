#!/usr/bin/env sh

usage() {
    echo "Usage: $0 (init|start|nuke)"
}

init() {
    docker build -t "postgraphile_next:latest" .
    docker-compose down -v --remove-orphans
    docker-compose up -d
    # Give PostgreSQL enough time to start
    sleep 30
    psql -1X -v ON_ERROR_STOP=1 'postgres://postgres:unsecured@localhost:5432/chinook' < ../../postgraphile/import/chinook_import
}

if [ "$#" -ne 1 ]; then
    usage
    exit 1
fi

case $1 in
    init)
        init
        exit
        ;;
    start)
        docker-compose down -v --remove-orphans
        docker-compose up -d
        exit
        ;;
    nuke)
        docker-compose down -v --remove-orphans
        exit
        ;;
    *)
        echo "unexpected option: $1"
        usage
        exit 1
        ;;
esac
