const myip = 'change to Ipv4 here'
window.onload = function () {
    $('.tooltipped').tooltip({position: 'right'});
    const app = new Vue({
        el: "#app",
    
        data: {
            showLogin: true,
            showerror: false,
            loading: false,
        },

        methods: {
            changeForm() {
                this.error = false
                this.showLogin = !this.showLogin
                console.log(this.showLogin)
            },

            handleForm() {
                if (this.showLogin) {
                    this.requestLogin()
                } else {
                    this.requestRegister()
                }
            },

            requestRegister() {
                console.log('lol')
                let data = this
                this.loading = true
                $.post({
                    type: 'POST',
                    url: `http://${myip}:8080/register`,
                    data: {
                        username: $('#username').val(),
                        password: $('#password').val(),
                    },
                    success: function(msg) {
                        // data.showerror = false
                        data.loading = false
                        M.toast({html: 'Kontoen er blevet oprettet.', classes: 'rounded green'});
                        

                    },

                    error: function(err) {
                        console.log('this?')
                        data.showerror = true
                        data.loading = false
                        $('#errmsg').html(err.responseJSON.message)
                    }
                })
            },

            requestLogin() {
                let data = this
                this.loading = true
                let username = $('#username').val()
                let password = $('#password').val()
                $.post({
                    type: 'POST',
                    url: `http://${myip}:8080/login`,
                    data: {
                        username: username,
                        password: password,
                    },
                    success: function(data) {
                        // data.showerror = false
                        console.log('sucess')
                        localStorage.setItem('token', data.user)
                        localStorage.setItem('username', username)
                        
                        const socket = io();
                        socket.on('connect', () => {
                                              
                            // alert(`You connected with: ${socket.id}`)
                        })
                        setTimeout(() => {
                            window.location.replace(`http://${myip}:8080/active`);
                        }, 500)
                    },

                    error: function(err) {
                        console.log('this?')
                        data.showerror = true
                        data.loading = false
                        $('#errmsg').html(err.responseJSON.message)
                    }
                })
            },
        },

        updated() {
            // MaterializeStuff()
        }
    })
    MaterializeStuff()

}

function MaterializeStuff() {
    $('.tooltipped').tooltip({position: 'right'});
    
    M.updateTextFields();
    $('.modal').modal();

}