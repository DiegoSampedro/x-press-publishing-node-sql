const express = require('express');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite')
const issuesRouter = express.Router({ mergeParams: true });

issuesRouter.param('issueId', (req, res, next, issueId) => {
    const sql = 'SELECT * FROM Issue WHERE Issue.id = $issueId';
    const value = { $issueId: issueId }
    db.get(sql, value, (error, issue) => {
        if(error) {
            next(error)
        } else if (issue) {
            next();
        } else {
            res.sendStatus(404);
        }
    })
})

issuesRouter.get('/', (req, res, next) => {
        db.all('SELECT * FROM Issue WHERE Issue.series_id = $seriesId', 
        {
            $seriesId: req.params.seriesId
        }, (error, issues) => {
            if(error) {
                next(error);
            } else {
                res.status(200).json({ issues: issues })
            }
        })
})

issuesRouter.post('/', (req, res, next) => {
    const name = req.body.issue.name;
    const issueNumber = req.body.issue.issueNumber;
    const publicationDate = req.body.issue.publicationDate;
    const artistId = req.body.issue.artistId;
    const sql = 'SELECT * FROM Artist WHERE Artist.id = $artistId';
    const values = { $artistId: artistId };
    db.get(sql, values, (error, artist) => {
        if(error) {
            next(error);
        } else {
            if(!name || !issueNumber || !publicationDate || !artistId) {
                return res.sendStatus(400);
            } else {
                db.run('INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id) VALUES ($name, $issueNumber, $publicationDate, $artistId, $seriesId)', 
                {
                    $name: name,
                    $issueNumber: issueNumber,
                    $publicationDate: publicationDate,
                    $artistId: artistId,
                    $seriesId: req.params.seriesId
                }, function(error) {
                    if(error) {
                        next(error);
                    } else {
                        db.get(`SELECT * FROM Issue WHERE Issue.id = ${this.lastID}`, (error, issue) => {
                            if(error) {
                                next(error);
                            } else {
                                res.status(201).json({ issue: issue });
                            }
                        })
                    }
                })
            }
        }
    })
     
})

issuesRouter.put('/:issueId', (req, res, next) => {
    const name = req.body.issue.name;
    const issueNumber = req.body.issue.issueNumber;
    const publicationDate = req.body.issue.publicationDate;
    const artistId = req.body.issue.artistId;
    const sql = 'SELECT * FROM Artist WHERE Artist.id = $artistId';
    const values = { $artistId: artistId };
    db.get(sql, values, (error, artist) => {
        if(error) {
            next(error);
        } else {
            if(!name || !issueNumber || !publicationDate || !artistId) {
                return res.sendStatus(400);
            } else {
                db.run('UPDATE Issue SET name = $name, issue_number = $issueNumber, publication_date = $publicationDate, artist_id = $artistId WHERE Issue.id = $issueId', 
                {
                    $name: name,
                    $issueNumber: issueNumber,
                    $publicationDate: publicationDate,
                    $artistId: artistId,
                    $issueId: req.params.issueId
                }, function(error) {
                    if(error) {
                        next(error);
                    } else {
                        db.get(`SELECT * FROM Issue WHERE Issue.id = ${req.params.issueId}`, (error, issue) => {
                            res.status(200).json({ issue: issue });
                            
                        })
                    }
                })
            }
        }
    })
})

issuesRouter.delete('/:issueId', (req, res, next) => {
    db.run('DELETE FROM Issue Where Issue.id = $issueId', 
    {
        $issueId: req.params.issueId
    }, function(error) {
        if(error) {
            next(error);
        } else {
            res.sendStatus(204);
        }
    })
})

module.exports = issuesRouter;