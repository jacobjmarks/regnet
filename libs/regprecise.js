const request = require("request");

module.exports.getGenomes = (cb) => {
    request({
        method: "GET",
        url: `http://regprecise.lbl.gov/Services/rest/genomeStats`,
    }, (error, response, body) => {
        if (response.statusCode != 200) return cb("Error retrieving genomes.");
        let genomes = JSON.parse(body)["genomeStat"];
        return cb(null, genomes.length ? genomes : [genomes]);
    })
}

module.exports.getRegulons = (genomeId, cb) => {
    request({
        method: "GET",
        url: `http://regprecise.lbl.gov/Services/rest/regulons?genomeId=${genomeId}`,
    }, (error, response, body) => {
        if (response.statusCode != 200) return cb("Error retrieving regulons.");
        let regulons = JSON.parse(body)["regulon"];
        return cb(null, regulons.length ? regulons : [regulons]);
    })
}

module.exports.getSites = (regulonId, cb) => {

    request({
        method: "GET",
        url: `http://regprecise.lbl.gov/Services/rest/sites?regulonId=${regulonId}`,
    }, (error, response, body) => {
        if (response.statusCode != 200) return cb("Error retrieving regulons.");
        let sites = JSON.parse(body)["site"];
        return cb(null, sites.length ? sites : [sites]);
    })
}

module.exports.genomeNetwork = (genomeId, type, cb) => {
    let network = {
        genomeId: genomeId,
        regulons: []
    };

    let regulonCount = 0;

    let addNode = (regulon, sites) => {
        regulon.sites = sites;
        network.regulons.push(regulon);        
        if (network.regulons.length == regulonCount) respond();
    }

    this.getRegulons(genomeId, (err, regulons) => {
        if (err) return cb(err);
        regulonCount = regulons.length;
        for (let regulon of regulons) {
            this.getSites(regulon["regulonId"], (err, sites) => {
                addNode(regulon, (!err) ? sites : null);
            })
        }
    })

    function respond() {
        switch(type) {
            case "dot":
                let graph = `digraph ${genomeId} {\n`;
                for (let regulon of network.regulons) {
                    graph += `\tsubgraph ${regulon.regulonId} {\n`;
                    // graph += `\t\tlabel="${regulon.regulonId}";\n`;
                    graph += `\t\t${regulon.regulonId} -> {\n`;
                    for (let site of regulon.sites) {
                        graph += `\t\t\t${site.geneVIMSSId}\n`;
                    }
                    graph += '\t\t}\n';
                    graph += '\t}\n';
                }
                graph += `\t${genomeId} -> {${network.regulons.map((r) => r.regulonId).join(' ')}}\n`;
                graph += '}';
                return cb(null, graph);
            case "json":
            default:
                cb(null, network)
        }
    }
}