# RegNet v0.1
#### [RegPrecise](http://regprecise.lbl.gov/RegPrecise/) REST Interface and Regulatory Network Generator

Initialise and start the Node application on port 3000: `npm install && npm start`

To generate an svg DOT graph using Neato: `./generate-graph.sh {genome ID}`

## Routes
#### `/genomes`
Index. Displays a list of RegPrecise genomes.

#### `/regulons/:genomeID`
Displays a list of regulons that regulate the given genome.

#### `/sites/:regulonID`
Display a list of gene sites for the given regulon.

#### `/network/:genomeID`
Retrieves a hierarchical network consisting of all regulators and their genes for the given genome.
Can be provided with a query string parameter `type` to indicate the format. Available options are:

* [`json`](http://localhost:3000/network/601?type=json) (default) Network is structed as a json object.
   
* [`dot`](http://localhost:3000/network/601?type=dot) Network is structed into DOT graph notation.
