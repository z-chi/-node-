var http = require('http');
var fs = require('fs');
var ejs = require('ejs');
var path = require('path');
var url = require('url');
var querystring = require('querystring');
var formidable = require('formidable');
var util = require('util');
var sdtime = require('silly-datetime');
var querystring = require('querystring');

http.createServer(function(req, res){
    var dictionary = {
        'a' : [6, 7, 8],
        'imgUrl' : './imgs/dir.png',
        'dirs' : [],
        'files' : [],
        'pathname' : ''
    };
    dictionary.pathname = url.parse(req.url).pathname; 
    // console.log(dictionary.pathname);
    if(req.url == '/favicon.ico'){
        return;
    }
    else if(req.url == '/' || req.url == '/index.html'){
        fs.readdir('./upload', function(err, files){
            (function check(i){
                fs.stat('./upload/'+files[i], function(err,stats){
                    if(i == files.length){
                        fs.readFile(__dirname + '/view/index.ejs', function(err, data){
                            if(err){
                                fs.readFile('./404.html', function(err, data){
                                    res.writeHead(404, {'Content-Type' : 'text/html;charset=utf8'});
                                    res.end(data);
                                });
                                return;
                            }
                            var template = ejs.compile(data.toString());
                            var htmlStr = template(dictionary);
                            res.writeHead(200, {'Content-Type' : 'text/html;charset=utf8'});
                            res.end(htmlStr);
                        });
                        return;
                    }
                    if(stats.isDirectory){
                        if(files[i] != 'cach'){
                            dictionary.dirs.push(files[i]);
                        }
                        // console.log(dictionary.dirs);
                    }
                    check(i+1);
                })
            })(0);
        })
        
    }
    else if(req.url == '/admin'){
        fs.readFile('./form.html', function(err, data){
            if(err){
                fs.readFile('./404.html', function(err, data){
                    res.writeHead(404, {'Content-Type' : 'text/html;charset=utf8'});
                    res.end(data);
                });
                return;
            }
            res.writeHead(200, {'Content-Type' : 'text/html;charset=utf8'});
            res.end(data);
        })
    }
    else if(req.url == '/dopost' && req.method.toLowerCase() == 'post'){
        /* var str = '';
        req.addListener('data', function(chunk){
            str += chunk;
        });
        req.addListener('end', function(){
            var dataObj = querystring.parse(str);
            // console.log(dataObj);
            console.log(dataObj);
            console.log('表单上传完毕。');
            res.end();
        }) */
        var form = new formidable.IncomingForm();
        form.uploadDir = './upload/cach';
        form.parse(req, function (err, fields, files) {
            if(err){
                throw err;
            }
            if (fields.newdir == 'yes') {
                fs.mkdir('./upload/' + fields.ndname, function (err) {
                    if (err) {
                        console.log('创建文件夹失败。');
                        return;
                    }
                });
            }
            var extName = path.extname(files.img.name);
            console.log(fields);
            console.log(extName);
            console.log(util.inspect(files));
            fs.readdir('./upload/cach', function(err, files){
                    (function moveFile(i){
                        var rename = sdtime.format(new Date(), 'YYYYMMDDHHmmss')+parseInt(Math.random()*9999);
                        if(i == files.length){
                            return;
                        }
                        fs.rename('./upload/cach/'+files[i], './upload/'+fields.dirname+'/'+rename+extName);
                        moveFile(i+1);
                    })(0);
            })
            /* fs.rename('./'+files.img.path, './'+'./upload/'+fields.dirname+'/'+rename, function(err){
                if(err){
                    throw err;
                    return;
                }
            }); */
            res.end();
        });
    }
    else if(dictionary.pathname.indexOf('.') == -1){
        // console.log(dictionary.pathname);
        fs.readFile('./view/photo.ejs', function(err, data){
            if(err){
                fs.readFile('./404.html', function(err, data){
                    res.writeHead(404, {'Content-Type' : 'text/html;charset=utf8'});
                    res.end(data);
                });
                return;
            }
            fs.readdir('./upload'+dictionary.pathname, function(err, files){
                if(err){
                    throw err;
                    return;
                }
                // console.log(files);
                (function checkFile(i){
                    fs.stat('./upload'+dictionary.pathname+'/'+files[i], function(err, stats){
                        // console.log(i);
                        if(i == files.length){
                            console.log('end');
                            // console.log(dictionary.files);
                            var template = ejs.compile(data.toString());
                            var htmlStr = template(dictionary);
                            res.writeHead(200, { 'Content-Type': 'text/html;charset=utf8' });
                            res.end(htmlStr);
                            return;
                        }
                        if(!stats.isDirectory()){
                            // console.log('stats')
                            dictionary.files.push(files[i]);
                            // console.log(dictionary.files);
                        }
                        checkFile(i+1);
                    })
                })(0)
            })
            
        });
    }
    else {
        fs.readFile('.'+dictionary.pathname, function(err, data){
            var extname = path.extname(dictionary.pathname);
            // console.log(extname);
            if(err){
                fs.readFile('./404.html', function(err, data){
                    res.writeHead(404, {'Content-Type' : 'text/html;charset=utf8'});
                    res.end(data);
                });
                return;
            }
            Mime(extname, function(mime){
                res.writeHead(200, {'Content-Type' : mime+';charset=utf8'});
                res.end(data);
            });
        });
    }
}).listen(80, '127.0.0.1', function(){
    console.log('成功监听80端口。');
})

function Mime(extname, fun){
    fs.readFile('./mime.json', function(err, data){
        if(err){
            throw err;
            return;
        }
        var dataObj = JSON.parse(data.toString());
        var mime = dataObj[extname];
        fun(mime);
    })
}