import express from 'express';
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import mysql from 'mysql'
import multer from 'multer'
import fs from 'fs'


const PORT = 5000;
const sql_password = ''

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let query_all="SELECT * from music"
let query_add="INSERT INTO music (name, folder, created, duration, auditions) VALUES (?, ?, NOW(), ?, 0)"
let query_rename = "UPDATE music SET name = ? WHERE name = ?"
let query_delete = "DELETE FROM music WHERE name = ?"
let query_auditions = "UPDATE music SET auditions = auditions + 1 WHERE name = ?"
let query_blocks = "SELECT * from default_playlist"
let query_getPlaylist = "SHOW TABLES LIKE ?"
var files
var blocks

var folders = {};
var today_data = []
var today_date
var loadPlaylistData
var loadPlaylistData2
var isToday


const app = express()

const storage = multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'music');
    },
    filename(req, file, cb) {
      cb(null, file.originalname); //для генерации уникальных названий можно добавлять время по CEST Date.now()
    },
  });

const upload = multer({ storage });

app.use(express.json());


app.use(express.static(path.resolve(__dirname, 'client')))
app.use(express.static(path.resolve(__dirname, 'music')))



function checkDate() {
    const currentDate = new Date()
    const year = currentDate.getFullYear()
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0')
    const formattedDate = `${year}-${month}-${day}`//ГГГГ-ММ-ДД
    today_date = 'playlist-' + formattedDate
}
  
checkDate()
checkPlaylist(today_date)

setInterval(checkDate, 30 * 60 * 1000);

function checkPlaylist(date){
    loadPlaylist(today_date)
    setTimeout(function() {
        if(loadPlaylistData == 0){
            isToday = false
            return
        }
        else{
            isToday = true
            setTimeout(function(){
                // today_data = loadTodayDb(today_date)
                loadTodayDb(today_date)
            }, 500)
        }
      }, 500)
}

const loadFiles = async (req, res) => {
    try {
        loadFilesDb()
        checkDate()
        checkPlaylist(today_date)
        await res.json(folders)
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Не удалось получить записи"
        })
    }
}


async function loadFilesDb(){
    const connection = mysql.createConnection({
        host: "127.0.0.1",
        user: "root",
        database: "music",
        password: sql_password
    });

    connection.connect( err => {
        if(err){
            console.log(err);
            console.log('con.loadFilesDb error')
            return err;
        }
        else
        {
            console.log("loadFilesDb.DB.CONNECTED");
        }
    });

    connection.query(query_all, (err, result) => {
        if(err){
            console.log(err)
            console.log('conn.query.all error')
        }
        else{
            files = result
            sortFiles(files)
        }
    })

    connection.end()
}

function addFileDb(filename, folder, duration){
    const connection = mysql.createConnection({
        host: "127.0.0.1",
        user: "root",
        database: "music",
        password: sql_password
    });
    
    connection.connect( err => {
        if(err){
            console.log(err);
            console.log('con.connect.add error')
            return err;
        }
        else
        {
            //console.log("DATABASE CONNECTED");
        }
    });

    connection.query(query_add, [filename, folder, duration], (err, result) => {
        if(err){
            console.log(err)
            console.log('conn.query.add error')
        }
        else{
            loadFilesDb()
            console.log(filename + ' added to DB!')
        }
    })

    connection.end()
}

function renameFile(oldName, newName){

    const oldPath = path.join(__dirname, 'music/' + oldName);
    const newPath = path.join(__dirname, 'music/' + newName);

    fs.rename(oldPath, newPath, (err) => {
        if (err) {
            console.log(err);
            return;
        }
        console.log('Файл ' + oldName + ' успешно переименован в ' + newName);
    });

    const connection = mysql.createConnection({
        host: "127.0.0.1",
        user: "root",
        database: "music",
        password: sql_password
    });
    
    connection.connect( err => {
        if(err){
            console.log(err);
            console.log('con.connect.rename error')
            return err;
        }
        else
        {
            //console.log("DATABASE CONNECTED");
        }
    });

    connection.query(query_rename, [newName, oldName], (err, result) => {
        if(err){
            console.log(err)
            console.log('conn.query.rename error')
        }
        else{
            loadFilesDb()
            console.log('Имя ' + newName + ' занесено в базу');
        }
    })

    connection.end()
}

function delFileDb(fileName){
    const connection = mysql.createConnection({
        host: "127.0.0.1",
        user: "root",
        database: "music",
        password: sql_password
    });
    
    connection.connect( err => {
        if(err){
            console.log(err);
            console.log('con.connect.delete error')
            return err;
        }
        else
        {
            //console.log("DATABASE CONNECTED");
        }
    });

    connection.query(query_delete, [fileName], (err, result) => {
        if(err){
            console.log(err)
            console.log('conn.query.delete error')
        }
        else{
            loadFilesDb()
            console.log('Файл ' + fileName + ' удален из базы');
        }
    })

    connection.end()
}

function addStatsDb(fileName) {
    const connection = mysql.createConnection({
        host: "127.0.0.1",
        user: "root",
        database: "music",
        password: sql_password
    });
    
    connection.connect( err => {
        if(err){
            console.log(err);
            console.log('con.connect.audition error')
            return err;
        }
        else
        {
            //console.log("DATABASE CONNECTED");
        }
    });

    connection.query(query_auditions, [fileName], (err, result) => {
        if(err){
            console.log(err)
            console.log('conn.query.audition error')
        }
        else{
            loadFilesDb()
        }
    })

    connection.end()
}
function loadBlocksDb() {
    const connection = mysql.createConnection({
        host: "127.0.0.1",
        user: "root",
        database: "music",
        password: sql_password
    });
    
    connection.connect( err => {
        if(err){
            console.log(err);
            console.log('con.connect.loadBlocksDb error')
            return err;
        }
        else
        {
            //console.log("DATABASE CONNECTED");
        }
    });

    connection.query(query_blocks, (err, result) => {
        if(err){
            console.log(err)
            console.log('conn.query.loadBlocksDb error')
        }
        else{
            blocks = result
            for(let i = 0; i < blocks.length; i++){
                if(blocks[i].track == undefined){
                    blocks[i].duration='0:00'
                }
                else{
                    blocks[i].duration=getDuration(blocks[i].track)
                }
            }
        }
    })
    connection.end()
}
function loadTodayDb(today) {
    const connection = mysql.createConnection({
        host: "127.0.0.1",
        user: "root",
        database: "music",
        password: sql_password
    });
    
    connection.connect( err => {
        if(err){
            console.log(err);
            console.log('con.connect.loadTodayDb error')
            return err;
        }
        else
        {
            //console.log("DATABASE CONNECTED");
        }
    });

    let query_today = `SELECT * FROM `+'`'+today+'`'
    connection.query(query_today, (err, result) => {
        if(err){
            console.log(err)
            console.log('conn.query.loadTodayDb error')
        }
        else{
            today_data = result
        }
    })

    connection.end()
}

function loadPlaylistDb(name) {
    return new Promise((resolve, reject) => {
    const connection = mysql.createConnection({
        host: "127.0.0.1",
        user: "root",
        database: "music",
        password: sql_password
    });
    
    connection.connect( err => {
        if(err){
            console.log(err)
            console.log('con.connect.loadPlaylistDb error')
            reject(err)
        }
        else
        {
            //console.log("DATABASE CONNECTED");
        }
    });

    let query = `SELECT * FROM `+'`'+name+'`'
    connection.query(query, (err, result) => {
        if(err){
            console.log(err)
            console.log('conn.query.loadPlaylistDb error')
            reject(err)
        }
        else{
            
            resolve(result)
        }
    })

    connection.end()
    })
}

function getDuration(tracks) {
    let totalSeconds = 0;
    tracks.forEach((track) => {
      const [minutes, seconds] = track.duration.split(':');
      totalSeconds += parseInt(minutes) * 60 + parseInt(seconds);
    });
    if(totalSeconds == 0){return '0:00'}
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}
 
function loadPlaylist(name){
    const connection = mysql.createConnection({
        host: "127.0.0.1",
        user: "root",
        database: "music",
        password: sql_password
    });

    connection.connect( err => {
        if(err){
            console.log(err);
            console.log('con.connect.loadPleylist error')
            return err;
        }
        else
        {
            //console.log("DATABASE CONNECTED");
        }
    });

    connection.query(query_getPlaylist, [name], (err, result) => {
        if(err){
            console.log(err)
            console.log('conn.query.loadPleylist error')
            
        }
        else{
            if(result.length == 0){
                loadPlaylistData = 0
            }
            else{
                loadPlaylistData = 1
            }
        }
    })

    connection.end()
}
function loadPlaylist2(name){
    return new Promise((resolve, reject) => {
        const connection = mysql.createConnection({
          host: "127.0.0.1",
          user: "root",
          database: "music",
          password: sql_password
        })
    
        connection.connect( err => {
          if(err){
            console.log(err)
            console.log('con.connect.loadPlaylist2 error')
            reject(err)
          }
          else
          {
             //console.log("DATABASE CONNECTED");
          }
        })
    
        connection.query(query_getPlaylist, [name], (err, result) => {
          if(err){
            console.log(err)
            console.log('conn.query.loadPlaylist2 error')
            reject(err)
          }
          else{
            if(result.length == 0){
              loadPlaylistData2 = 0
              resolve(0)
            }
            else{
              loadPlaylistData2 = 1
              resolve(result)
            }
          }
        })
    
        connection.end()
      })
}


function createNewPlaylist(name, blocks){
    const connection = mysql.createConnection({
        host: "127.0.0.1",
        user: "root",
        database: "music",
        password: sql_password
    })

    connection.connect( err => {
        if(err){
            console.log(err)
            console.log('con.connect.loadPleylist error')
            return err
        }
        else
        {
            //console.log("DATABASE CONNECTED");
        }
    })

    let query_createNewPlaylist = `CREATE TABLE IF NOT EXISTS `+'`'+name+'`'+` LIKE playlist`
    
    connection.query(query_createNewPlaylist, [name], (err, result) => {
        if(err){
            console.log(err)
            console.log('conn.query.loadPleylist error')
            return
        }
        else{
            
        }
        
    })

    const data = []
        let mas = []
        let nm = ''
            for(let i = 0; i < blocks.length; i++){
                //console.log(blocks[i].ids)
                if(i == blocks.length-1){
                    //console.log("1stIF")
                    data.push({
                        block_name: "('"+blocks[i].block_name+"',",
                        block_time: "'"+blocks[i].block_time+"',",
                        block_time_up: "'"+60+"',",
                        block_time_down: "'"+60+"',",
                        block_type: "'"+'ads'+"',",
                        block_tracks: "'"+blocks[i].ids+"');"
                    })
                    
                }
                else{
                data.push({
                    block_name: "('"+blocks[i].block_name+"',",
                    block_time: "'"+blocks[i].block_time+"',",
                    block_time_up: +60+",",
                    block_time_down: +60+",",
                    block_type: "'"+'ads'+"',",
                    block_tracks: "'"+blocks[i].ids+"'),"
                })}
                if(data[i].block_tracks.indexOf('undefined') != -1){
                    //console.log("2stIF")
                    data[i].block_tracks="''),"
                }
                if(i == blocks.length -1){
                    //console.log("3stIF")
                    data[i].block_tracks="'');"
                }
            }
            
            for(let i = 0; i < data.length; i++){
                // mas.push(data[i].block_name+data[i].block_time+data[i].block_time_up+data[i].block_time_down+data[i].block_type+data[i].block_tracks)
                nm+=data[i].block_name+data[i].block_time+data[i].block_time_up+data[i].block_time_down+data[i].block_type+data[i].block_tracks
                //console.log(mas[i])
            }
            connection.query(`INSERT INTO `+'`'+`${name}`+'`'+ `(block_name, block_time, block_time_up, block_time_down, block_type, block_tracks) VALUES ${nm}`, (err, res) =>{
                if(err){
                    console.log(err)
                }
            })
            if(name == today_date){
                loadPlaylist(today_date)
                isToday = true
            }

    connection.end()
}

function sortFiles(files){
    folders = {};
    for(let i = 0; i < files.length; i++){
        //console.log(files[i].folder)
        // Проверяем, существует ли уже массив для данной папки, если нет - создаем его.
        if(!folders[files[i].folder]){
            folders[files[i].folder] = [];
        }
        // Добавляем id и name в массив для данной папки.
        folders[files[i].folder].push({id: files[i].id, name: files[i].name, created: files[i].created,duration: files[i].duration, auditions: files[i].auditions});
    }
}

loadFilesDb()
loadBlocksDb()
app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'index.html'))
  })

app.get('/loadFiles', loadFiles)


app.post('/upload', upload.single('file'), (req, res) => {
    addFileDb(req.file.filename, req.body.folder, req.body.duration)
    res.send('UPLOADED: ' + req.file.originalname);
  });

app.post('/api/rename', (req, res) =>{
    const data = req.body
    renameFile(data.currentName,data.newName)
    res.status(200).send('Success!');
})

app.get('/api/delete', (req, res) =>{
    const pathToFile = './music/' + req.query.musicName;

    delFileDb(req.query.musicName)
    loadFilesDb()

    fs.unlink(pathToFile, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send('Ошибка при удалении файла');
      } else {
        res.send('true');
      }
    });
})

app.get('/audio', (req, res) => {
    const audioFile = path.join(__dirname, 'music/' + req.query.musicName);
    var now = new Date()
    console.log(now + ' ' +  req.ip + " запросил " + req.query.musicName)
    addStatsDb(req.query.musicName)
    res.sendFile(audioFile);
});


app.get('/api/playlists/get', async (req, res) => {
    checkDate()
    checkPlaylist(today_date)
    if(req.query.playlistname == today_date){
        if(isToday){
            res.json(today_data)
            return

        }else{
            res.json(0)
            return
        }
    }
    else{
        var result = await loadPlaylist2(req.query.playlistname)
        if(loadPlaylistData2 == 1){
            res.json(await loadPlaylistDb(req.query.playlistname))
        }
        else(
            res.json(0)//0
        )
    }
})

app.post('/api/playlists/post', (req, res) => {
    var data = req.body.blocks
    for(let i = 0; i < data.length; i++){
        if(data[i].track != undefined){
            data[i].ids = ''
            for(let j = 0; j < data[i].track.length;j++){
                data[i].ids+=data[i].track[j].id+','
            }
        }
    }

    createNewPlaylist(req.body.name, data)


    res.send(req.name + 'uploaded!')
})

app.get('/api/playlists/blocks', (req, res) => {

    res.json(blocks)
})


app.listen(PORT, (err) => {
    if(err){
      return console.log(err);
    }
    console.log('Server OK (:' + PORT + ')')
  })