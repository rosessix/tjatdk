const express = require('express');

const app = express()
const port = 8080;
const clientpath = './client'
const bodyparser = require('body-parser');
const mysql = require('mysql');
const cors = require('cors');
const bcrypt = require('bcrypt');
const res = require('express/lib/response');
const myip = 'change to ipv4 here'
let saltRounds = 10
let users = []
let servers = []

const defaultimages = [
    'https://studerende.ida.dk/wp-content/uploads/2020/01/N_Pulse_B4_RGB-002.png',
]   

const defaultavatar = 'https://media.istockphoto.com/vectors/default-profile-picture-avatar-photo-placeholder-vector-illustration-vector-id1223671392?k=20&m=1223671392&s=612x612&w=0&h=lGpj2vWAI3WUT1JeJWm1PRoHT3V15_1pdcTn2szdwQ0='

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'tjatdk'
})
  
connection.connect()

connection.query('SELECT * FROM servers', [], (err, rows, fields) => {
    for(let i = 0; i < rows.length; i++) {
        let val = rows[i]
        servers[String(val.uid)] = {id: `servers-${val.uid}`, name: val.name, icon: val.icon, uid: val.uid, invitecode: val.invitecode}
    }
})

app.use(cors())

app.use(bodyparser.urlencoded({
    extended: true
}));
app.get('/', (req, res) => {
    // if sessioned return to register if not go to active
    res.sendFile(`index.html`, {root: clientpath})
})

app.get('/login', (req, res ) => {
    res.sendFile(`register.html`, {root: clientpath})
})

app.get('/active', (req, res) => {
    res.sendFile(`active.html`, {root: clientpath})
})

app.post('/register', (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    let tag = GenerateRandom('DDDD')
    connection.query('SELECT * FROM users WHERE username = ?', [username], (err, rows, fields) => {
        if (err) throw err
        if (rows[0] == undefined) {
            // no users with that username found
            bcrypt.hash(password, saltRounds, function(err, hash) {
                connection.query('INSERT INTO users SET ?', {username: username, password: hash, tag: tag, displayname: username}, function(error, result, field) {
                    // user created
                    res.sendStatus(200);

                })
                // Store hash in your password DB.
            });
        } else {
            return res.status(400).send({
                message: 'Dette navn er allerede i brug.'
            });
        }
    })
})

app.post('/login', (req, res) => {
    let username = req.body.username;
    let pass = req.body.password;
    let response = res
    if (!username && !pass) return res.status(400).send({message: 'Der opstod en fejl.'});

    connection.query('SELECT * FROM users WHERE username = ?', [username], (err, rows, fields) => {
        if (rows[0] == undefined) {
            return res.status(400).send({
                message: 'De indtastede loginoplysninger var ikke korekte.'
            });
        }
        bcrypt.compare(pass, rows[0].password).then(function(result) {
            if (result == true) {
                console.log('the password was correct')
                response.status(200).send({
                    user: rows[0].id
                })

            } else {
                return res.status(400).send({
                    message: 'De indtastede loginoplysninger var ikke korekte.'
                });
            }
        });
    })
})

app.post('/createserver', (req, res) => {
    let name = req.body.name
    let icon = defaultimages[Math.floor(Math.random() * defaultimages.length)] || req.body.icon
    if(!isImage(icon)) {
        //get random from array
        icon = defaultimages[Math.floor(Math.random() * defaultimages.length)]
    }
    let uid = GenerateRandom('DDDDDDD')
    let invite = GenerateRandom('LDLDDLL')
    connection.query('INSERT INTO servers SET ?', {uid: uid, name: name, icon: icon, invitecode: invite}, (err, rows, field) => {
        if (err) throw err

        servers[uid.toString()] = {id: `server-${uid}`, name: name, icon: icon, uid: uid, invitecode: invite}

        // add user to server aswell

        res.status(200).send(servers[uid.toString()])
    })
})

app.post('/joinserver', (req, res) => {
    let invitecode = req.body.invitecode;
    let id = req.body.id.toString()
    connection.query('SELECT * FROM servers WHERE invitecode = ?', [invitecode], (err, rows, field) => {
        if (err) throw err;
        if (rows[0] != undefined) {
            var server = rows[0]
            connection.query('SELECT servers FROM users WHERE id = ?', [id], (err, rows, field) => {
                let userserver = users[id].servers
                let found = false
                for(let i = 0; i < userserver.length; i++) {
                    // console.log(userserver[i], server.uid)
                    if(userserver[i] == server.uid) {
                        found = true
                    }
                }

                if (!found) {
                    userserver.push(server)
                    // console.log('pushed server')
                } 
                
                let idservers = []

                userserver.forEach((server ) => {
                    // console.log(server.uid)
                    idservers.push(server.uid)
                })
                // console.log(JSON.stringify(idservers))

                connection.query('UPDATE users SET servers = ? WHERE id = ?', [JSON.stringify(idservers), parseInt(id)], (err, rows, field) => {
                    if (err) throw err;
                    res.status(200).send(userserver)
                })
            })
        } else {
            res.status(400).send({message: 'Intet fællesskab fundet med den invitationskode'})
        }
        // res.sendStatus(200)
    })
})

app.get('/servers', (req, res) => {
    let id = req.query.id
    let userserver = users[id].servers
    
    res.status(200).json(userserver)
})

app.get('/getuserdata', (req, res) => {
    let id = req.query.id
    let user = users[id]
    let _user = user
    _user.socket = null;
    res.status(200).json(user)
})

app.get('/changeprofiledata', (req, res) => {
    let id = req.query.id
    let username = req.query.username
    let image = req.query.image

    if(image == undefined || image == '') {
        image = defaultavatar
    }

    if(username == undefined || username == '') {
        username = users[id.toString()].username
    }

    connection.query('UPDATE users SET displayname = ?, avatar = ? WHERE id = ?', [username, image, id], (err, rows, field) => {
        if (err) throw err;
        let user = users[id.toString()]
        user.displayname = username
        user.avatar = image
        res.status(200).send(user)
    })
})

// io shit
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: `http://${myip}:8080`,
        methods: ["GET", "POST"]
    }
});


io.on('connection', socket => {
    socket.authenticated = false
    console.log('user connected again')
    socket.on('confirmlogin', function(id, username){
        if(id == undefined && username == undefined) return socket.emit('confirm-auth', undefined)

        socket.authenticated = true
        id = id.toString()

        users[id] = {username: username, socket: socket, servers: []}
        connection.query('SELECT * FROM users WHERE id = ?', [id], (err, rows, field) => {
            if(rows[0].servers == null){
                return users[id].servers = [];
            }

            users[id].avatar = rows[0].avatar || defaultavatar
            users[id].displayname = rows[0].displayname || rows[0].username
            console.log('sat avatar')
            let val = JSON.parse(rows[0].servers)
            for (let i = 0; i < val.length; i++) {
                // console.log(`val-i ${val[i]} : val: ${val}`)
                // console.log(servers[String(val)])
                if(servers[String(val[i])] != undefined) {
                    users[id].servers.push(servers[String(val[i])])
                }
            }
            // users[id].servers.filter(element => element != undefined)
            // console.log(users[id].servers)
        })

        if(users[id] == undefined) {
            console.log('disconnecting user')
            return socket.disconnect();
        }
        let _user = Object.assign({}, users[id]);
        _user.socket = null
        
        socket.emit('confirm-auth', _user)
    })

    // on sendmessage
    socket.on('send-message', function(id, channel, message){
        if(!socket.authenticated) return;
        if(!channel.id) return;
        let _user = Object.assign({}, users[id]);
        _user.socket = null
        //replace space with - in channel name
        let gamerchannel = channel.id.replace(/\s/g, '-')
        io.to(gamerchannel).emit('new-message', _user, message)
    })

    //on join channel
    socket.on('join-channel', function(id, channel){
        console.log(socket.authenticated)
        if(!socket.authenticated) return;
        let gamerchannel = channel.replace(/\s/g, '-')

        if(users[id].channel != channel) {
            socket.leave(users[id].channel)
        } 

        socket.join(gamerchannel)
        users[id].channel = gamerchannel
        console.log(`user ${id} joined channel ${gamerchannel}`)
    })

})


// end of io shit

/**
 * 
 * @param {string} format - DDDD or LLLL ! has to be uppercase
 */
function GenerateRandom(format) {
    let numbers = [1,2,3,4,5,6,7,8,9,0]
    let letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W','X', 'Y', 'Z']
    let gen = 0

    let splitted = format.split('')

    splitted.forEach((value) => {
        if(value == 'D') {
            let random = Math.floor(Math.random() * numbers.length);
            gen += numbers[random].toString()
        }
        if(value == 'L') {
            let random = Math.floor(Math.random() * letters.length);
            gen += letters[random]
        }
    })

    return gen
}


/* 

    CHANNEL SYSTEM

   in database store the id of the channel, and the server it belongs to
   
   when fetching the channel, use the id of the server to check existing channels within the server


*/


function isImage(url) {
    return /\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(url);
  }


app.use(express.static(__dirname + '/client/'));

server.listen(port, () => {
    console.log(`tjat running on http://${myip}:${port}`)
})