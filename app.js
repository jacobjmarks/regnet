const path = require("path");
const express = require("express");
const app = express();

const regprecise = require("./libs/regprecise.js");

const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/genomes", (req, res) => {
    regprecise.getGenomes((err, genomes) => {
        if (err) return res.status(500).end(err);
        if (req.headers.accept == "application/json") {
            res.json(genomes);
        } else {
            res.render("genomes.pug", { genomes: genomes });
        }
    })
})

app.get("/regulons/:genomeId", (req, res) => {
    regprecise.getRegulons(req.params.genomeId, (err, regulons) => {
        if (err) return res.status(500).end(err);
        res.render("regulons.pug", { regulons: regulons });
    })
})

app.get("/sites/:regulonId", (req, res) => {
    regprecise.getSites(req.params.regulonId, (err, sites) => {
        if (err) return res.status(500).end(err);
        res.render("sites.pug", { sites: sites });
    })
})

app.get("/network/:genomeId", (req, res) => {
    regprecise.genomeNetwork(req.params.genomeId, req.query.type, (err, network) => {
        if (err) return res.status(500).end(err);
        res.send(network);
        res.end();
    })
})

function hello() {
    
}

app.listen(PORT, () => {
    console.log("Server listening on port " + PORT)
})