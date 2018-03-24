if [ -z $1 ]; then
    echo "Please specify a RegPrecise Genome ID."
    exit
fi

if [[ `wget -o - -nv localhost:3000 | grep "Connection refused."` ]]; then
    echo "Node server is not running!"
    exit
fi

curl -s localhost:3000/network/$1?type=dot > $1.dot
neato -Tsvg -Goverlap=scaled $1.dot  > $1.svg