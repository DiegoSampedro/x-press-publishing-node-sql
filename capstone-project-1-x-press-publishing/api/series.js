const express = require('express');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite')
const seriesRouter = express.Router();
const issuesRouter = require('./issues');

seriesRouter.param('seriesId', (req, res, next, seriesId) => {
    const sql = 'SELECT * FROM Series WHERE Series.id = $seriesId';
    const value = { $seriesId: seriesId }
    db.get(sql, value, (error, series) => {
        if(error) {
            next(error)
        } else if (series) {
            req.series = series;
            next();
        } else {
            res.sendStatus(404);
        }
    })
})

seriesRouter.use('/:seriesId/issues', issuesRouter);

seriesRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Series', (err, series) => {
        if(err) {
            next(err);
        } else {
            res.status(200).json({ series: series })
        }
    });
})

seriesRouter.get('/:seriesId', (req, res, next) => {
    res.status(200).json({ series: req.series })
})

seriesRouter.post('/', (req, res, next) => {
    const name = req.body.series.name;
    const description = req.body.series.description;
    if(!name || !description) {
        return res.sendStatus(400);
    } else {
        db.run("INSERT INTO Series (name, description) VALUES ($name, $description)", 
        {
            $name: name,
            $description: description
        }, function(error) {
            if (error) {
                next(error);
            } else {
                db.get(`SELECT * FROM Series WHERE Series.id = ${this.lastID}`, (error, series) => {
                    res.status(201).json({ series: series })
                })
            }
        })
    }
})

seriesRouter.put('/:seriesId', (req, res, next) => {
    const name = req.body.series.name;
    const description = req.body.series.description;
    if(!name || !description) {
        return res.sendStatus(400);
    }

    db.run('UPDATE Series SET name = $name, description = $description WHERE Series.id = $seriesId', 
    {
        $name: name,
        $description: description,
        $seriesId: req.params.seriesId
    }, (error) => {
        if(error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Series WHERE Series.id = ${req.params.seriesId}`, (error, series) => {
                res.status(200).json({ series: series })
        })
    }
    })
})

seriesRouter.delete('/:seriesId', (req, res, next) => {
    const issueSql = 'SELECT * FROM Issue WHERE Issue.series_id = $seriesId';
    const issueValues = { $seriesId: req.params.seriesId };
    db.get(issueSql, issueValues, (error, issue) => {
        if(error) {
            next(error);
        } else if(issue) {
            res.sendStatus(400);
        } else {
            db.get(`DELETE FROM Series WHERE Series.id = $seriesId`, 
            {
                $seriesId: req.params.seriesId
            }, (error) => {
                if(error) {
                    next(error);
                }

                res.sendStatus(204)
            })
        }
    })

})



module.exports = seriesRouter;