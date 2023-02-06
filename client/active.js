const myip = 'change to Ipv4 here'
let app
let isActive = true
let isPlaying = false;
let unreadMessages = 0;
const title = document.title
window.onload = function () {
    const socket = io();
    $('.tooltipped').tooltip({position: 'right'});
    app = new Vue({
        el: "#app",
        
        data: {
            currentServer: undefined,
            user: {
                name: 'phoz'
            },
            serverList: [
                // {id: 'server-friends', name: 'gaming lol', icon: "https://seeklogo.com/images/D/discord-icon-new-2021-logo-09772BF096-seeklogo.com.png"},
            ],

            channelList: [
                {id: 'channel-lmfaolol', name: 'kanal-1'},
                {id: 'channel-lmfaolol', name: 'kanal-2'},
                {id: 'channel-lmfaolol', name: 'kanal-3'},
            ],

            messageList: [
                // {id: 'message-1', content: 'hej', author : {username: 'phoz', avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTvNGTLN4hr2HVD51nKlrwRAlO1TK4-2zHNUA&usqp=CAU'}, time: '10:23'},
            ],
            currentChannel: [],

            addServerName: '',
            addServerImage: '',
        },

        methods: {
            changeServer(serverindex) {
                let server = this.serverList[serverindex]
                this.currentServer = server
                let oldElem = $(`.activeserver`)
                oldElem.removeClass('activeserver')
                $(`#${server.id}`).addClass('activeserver')
                $('.messagecontent').html('')

                // request data

                // set data
            },

            changeChannel(servername, channel) {
                if(this.currentChannel?.id == channel.id) return;
                let channelid = `channel-${servername}-${channel.name}`
                let oldElem = $(`.activechannel`)
                oldElem.removeClass('activechannel')
                $(`#${channelid}`).addClass('activechannel')
                this.currentChannel = {id: channelid, name: channel.name}

                // request data
                let id = localStorage.getItem('token')                   
                socket.emit('join-channel', id, channelid)

                $('.messagecontent').html('')
            },

            changeProfileData() {
                let id = localStorage.getItem('token')
                let username = $(`#changeprofilename`).val()
                let image = $(`#changeprofileimage`).val()
                $.post({
                    type: 'GET',
                    url: `http://${myip}:8080/changeprofiledata`,
                    data: {
                        id: localStorage.getItem('token'),
                        username: username,
                        image: image,
                    },

                    success: function(data) {
                        M.toast({html: "Profilen blev opdateret", classes: 'rounded green'});
                        app.user.avatar = data.avatar
                    }

                })
            },

            createServer() {
                let servername = $('#addserver_name').val()
                let serverimage = $('#addserver_image').val()

                $.post({
                    type: 'POST',
                    url: `http://${myip}:8080/createserver`,
                    data: {
                        name: servername,
                        image: serverimage,
                    },

                    success: function(data) {
                        console.log(`Server created: ${data}`)
                        app.joinServer(null, data.invitecode)
                    }
                })
            },

            sendMessage() {
                let message = $('#message-input').val()
                console.log(message)
                let id = localStorage.getItem('token')
                console.log(this.currentChannel)
                socket.emit('send-message', id, this.currentChannel, message)
                $('#message-input').val('')
            },

            joinServer(gamer, invite) {
                let invitecode = $('#joinserver_link').val()
                console.log(invite)
                if (invite != undefined) invitecode = invite
                console.log(`invite code ${invitecode}`)
                $.post({
                    type: 'POST',
                    url: `http://${myip}:8080/joinserver`,
                    data: {
                        invitecode: invitecode,
                        id: localStorage.getItem('token')
                    },

                    success(_data) {
                        console.log('joined')
                        $.get({
                            type: 'GET',
                            url: `http://${myip}:8080/servers`,
                            data: {id: localStorage.getItem('token') },
                
                            success(data) {
                                console.log(data)
                                app.setServers(data)
                                // app.setUserData(user.user)
                            },
                            error(data) {
                                window.location.replace(`http://${myip}:8080/login`);
                                app.setServers({})
                            }
                        })
                    },

                    error(data) {
                        console.log(data)
                        M.toast({html: data.responseJSON.message, classes: 'rounded red'});
                    },
                })
            },

            setServers(servers) {
                this.serverList = servers
                setTimeout(() => {
                    $('.tooltipped').tooltip({position: 'right'});
                    
                }, 300)
                console.log(servers)
            },

            setUserData(user) {
                console.log(user)
                this.user = user
            },

            insertMessage() {
                this.messageList.push({
                    id: 'message-1',
                    content: 'hej',
                    author : {name: 'phoz'},
                    time: '10:23'
                })
            },

            newMessage(user, message) {
                console.log(user, message)
                // get current time
                let time = new Date().toLocaleTimeString()
                let id = `message-${this.messageList.length + 1}`
                console.log(id)

                this.messageList.push({
                    id: id,
                    content: message,
                    author : user,
                    time: time
                })
                playNotification()
                
                setTimeout(() => {
                    let element = document.getElementById(id).scrollIntoView();

                }, 100)
            },

            CopyToClipboard(text, notif, notifmsg) {
                console.log(text, notif, notifmsg)
                let textArea = document.createElement("textarea");
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);
                if (notif == true) {
                    M.toast({html: notifmsg, classes: 'rounded green'});
                }
            },
        },

        updated() {
            // MaterializeStuff()
        }
    })
    MaterializeStuff()

    guidedTour()

    socket.on('connect', () => {
        let id = localStorage.getItem('token') 
        // get username
        let username = localStorage.getItem('username')                  
        // socket.emit('auth', id)
        socket.emit('confirmlogin', id, username)

        socket.on('confirm-auth', (user) => {
            if (user == undefined) return window.location.replace(`http://${myip}:8080/login`);
            console.log('trying to get servers')
            $.get({
                type: 'GET',
                url: `http://${myip}:8080/servers`,
                data: {id: localStorage.getItem('token') },
    
                success(data) {
                    // console.log(`lol ` +user.user)
                    app.setServers(data)
                    // app.setUserData(user.user)
                },
                error(data) {
                    window.location.replace(`http://${myip}:8080/login`);
                    app.setServers({})
                }
            })

            $.get({
                type: 'GET',
                url: `http://${myip}:8080/getuserdata`,
                data: {id: localStorage.getItem('token') },
    
                success(data) {
                    // console.log(`lol ` +user.user)
                    app.setUserData(data)
                    // app.setUserData(user.user)
                },
                error(data) {
                    window.location.replace(`http://${myip}:8080/login`);
                    app.setUserData({})
                }
            })
        })

        socket.on('updateservers', (data) => {
            console.log(`data ${data}`)
        })

        socket.on('joined-channel', (data) => {
            app.insertMessage()
        })

        socket.on('new-message', (user, message) => {
            console.log(`new-message was emitted`)
            app.newMessage(user, message)
            // app.insertMessage()

        })

        // alert(`You connected with: ${socket.id}`)
    })
}

function insertMessage() {
    for (let i = 0; i < 10; i++) {
        app.insertMessage()
    }
}

function MaterializeStuff() {
    $('.tooltipped').tooltip({position: 'right'});
    
    M.updateTextFields();
    $('.modal').modal();
}

function guidedTour() {
    const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
            cancelIcon: {
                enabled: true,
                classes: 'antiscrollbar',
            },
            scrollTo: { behavior: 'smooth', block: 'center' }
        }
    });

    const steps = [
        {
            classes: 'antiscrollbar',
            title: 'Velkommen',
            text: 'Velkommen til tjat.dk',
            buttons: [
                {
                    text: 'Næste',
                    action: tour.next
                }
            ]
        },
        {
            classes: 'antiscrollbar',
            title: 'Server liste.',
            text: 'Det her er din server liste.',
            attachTo: {
                element: '#serverlist',
                on: 'right',
            },
            buttons: [
                {
                    text: 'Næste',
                    action: tour.next
                }
            ]
        },
        {
            classes: 'antiscrollbar',
            title: 'Her er du🤓.',
            text: 'Her kan du ændr dit navn og dit billede.',
            attachTo: {
                element: '#myuser',
                on: 'right',
            },
            buttons: [
                {
                    text: 'Næste',
                    action: tour.next
                }
            ]
        },
        {
            classes: 'antiscrollbar',
            title: 'Lad os lave en server.',
            text: 'Tryk her for at oprette et fællesskab, så din serverliste ikke ser så tom ud.',
            attachTo: {
                element: '#server-addserver',
                on: 'right',
            },
            buttons: [
                {
                    text: 'Kom igang',
                    action: tour.next
                }
            ]
        },
        
    ]

    tour.addSteps(steps);

    setTimeout(() => {
        console.log('started tour')
        tour.start()
    }, 2500)
    
    console.log('added tour')
}

function playNotification() {
    if(!isActive) {
        unreadMessages += 1
        document.title = `(${unreadMessages}) ${title}`
        if (!isPlaying) {
            let audio = new Audio('./notify.mp3')
            audio.play()
            isPlaying = true
            audio.onended = function() {
                isPlaying = false
            };
        }
    }
}

$(window).focus(function(){
    isActive = true;
    unreadMessages = 0;
    document.title = title
}).blur(function(){
    isActive = false;
});