toggleFab();
let sendMessage = '';
//define chat color
if (typeof Storage !== 'undefined') {
    if (localStorage.getItem('fab-color') === null) {
        localStorage.setItem('fab-color', 'blue');
    }
    $('.fabs').addClass(localStorage.getItem('fab-color'));
} else {
    $('.fabs').addClass('blue');
}

//Fab click
$('#prime').click(function () {
    toggleFab();
});

//Speak admin msg
function botSpeak(text) {
    // var msg = new SpeechSynthesisUtterance();
    // msg.text = 'Hello World';
    // window.speechSynthesis.speak(msg);
    // if ('speechSynthesis' in window) {
    //     var msg = new SpeechSynthesisUtterance('chao ban');
    //     window.speechSynthesis.speak(msg);
    // }
}

//Toggle chat and links
function toggleFab() {
    $('.prime').toggleClass('zmdi-plus');
    $('.prime').toggleClass('zmdi-close');
    $('.prime').toggleClass('is-active');
    $('#prime').toggleClass('is-float');
    $('.chat').toggleClass('is-visible');
    $('.fab').toggleClass('is-visible');
}

//User msg
function userSend(text) {
    sendMessage = $('#chatSend').val();
    console.log(sendMessage);
    text = text.replaceAll('\n', '<br>');
    var img = '<i class="zmdi zmdi-account"></i>';
    $('#chat_converse').append(
        '<div class="chat_msg_item chat_msg_item_user"><div class="chat_avatar">' + img + '</div>' + text + '</div>',
    );
    $('#chatSend').val('');
    if ($('.chat_converse').height() >= 256) {
        $('.chat_converse').addClass('is-max');
    }
    $('.chat_converse').scrollTop($('.chat_converse')[0].scrollHeight);
}

//Admin msg
function adminSend(text) {
    axios
        .post('/chat', {
            message: sendMessage,
        })
        .then(
            ({ data }) => {
                if (data.response.type === 'fontSingle') {
                    let dataFont = data.response.data;
                    let ui = `<div class="chat_msg_item chat_msg_item_admin">
                    <div class="chat_avatar">
                      <i class="zmdi zmdi-headset-mic"></i>
                    </div>
                    <img class="chat_img" src="${dataFont.image}" alt="">
                    <div class="hehe">
                        <h3 class="nameFont">${dataFont.name}</h3>
                        <a href="${dataFont.link}">Tải xuống</a>
                        <p>${dataFont.message}</p>
                    </div>
                    </div>`;
                    appendUi(ui);
                } else if (data.response.type === 'fontArray') {
                    let limit = 10;
                    let dataFont = data.response.data;
                    let message = '';

                    let page = Math.ceil(dataFont.length / limit);
                    for (let i = 0; i < page; i++) {
                        for (let j = i * limit; j < (i + 1) * limit && j < dataFont.length; j++) {
                            message += `Tên font:<br>${dataFont[j].name}<br>Link tải:<br> <a href="${dataFont[j].link}">${dataFont[j].link}</a>\n\n <br><br>`;
                        }
                        let ui = `<div class="chat_msg_item chat_msg_item_admin">
                        <div class="chat_avatar">
                          <i class="zmdi zmdi-headset-mic"></i>
                        </div>
                        <div class="hehe">
                            <p class="nameFont">${message}</p>
                        </div>
                        </div>`;
                        appendUi(ui);
                        message = '';
                    }
                    return;
                } else if (data.response.type === 'data') {
                    let dataMessage = data.response.data;
                    let ui = `<div class="chat_msg_item chat_msg_item_admin">
                    <div class="chat_avatar">
                      <i class="zmdi zmdi-headset-mic"></i>
                    </div>
                  
                    <div class="hehe">
                       ${dataMessage}
                    </div>
                    </div>`;
                    appendUi(ui);
                } else if (data.response.type === 'listFont') {
                    var listFont = data.response.data;
                    listFont.forEach((element) => {
                        let ui = `<div class="chat_msg_item chat_msg_item_admin">
                    <div class="chat_avatar">
                      <i class="zmdi zmdi-headset-mic"></i>
                    </div>
                        ${element}
                    <div class="hehe">
                      
                    </div>
                    </div>`;
                        appendUi(ui);
                    });
                }

                // let img = '';
                // if (response.data.img != null) {
                //     img = `<img class="chat_img" src="${response.data.img}" alt="">`;
                // }
                // let message = response.data.result.text;
                // let ui = `<div class="chat_msg_item chat_msg_item_admin">
                //             <div class="chat_avatar">
                //                 <i class="zmdi zmdi-headset-mic"></i>
                //             </div>
                //             ${img}
                //             ${message}
                //         </div>`;
            },
            (error) => {
                console.log(error);
            },
        );
}
let appendUi = (ui) => {
    $('#chat_converse').append(ui);

    if ($('.chat_converse').height() >= 256) {
        $('.chat_converse').addClass('is-max');
    }
    $('.chat_converse').scrollTop($('.chat_converse')[0].scrollHeight);
};
//Send input using enter and send key
$('#chatSend').bind('enterChat', function (e) {
    userSend($('#chatSend').val());
    adminSend('How may I help you.');
});
$('#fab_send').bind('enterChat', function (e) {
    userSend($('#chatSend').val());
    adminSend('How may I help you.');
});
$('#chatSend').keypress(function (event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        if (jQuery.trim($('#chatSend').val()) !== '') {
            $(this).trigger('enterChat');
        }
    }
});

$('#fab_send').click(function (e) {
    if (jQuery.trim($('#chatSend').val()) !== '') {
        $(this).trigger('enterChat');
    }
});

//Listen user voice
$('#fab_listen').click(function () {
    var recognition = new webkitSpeechRecognition();

    loadBeat(true);
    recognition.onresult = function (event) {
        var text = event.results[0][0].transcript;
        $('#chatSend').val(text);
    };
    recognition.onerror = function (event) {
        console.error(event);
        recognition.stop();

        loadBeat(false);
    };

    recognition.onsoundend = function () {
        recognition.stop();
        loadBeat(false);
    };

    // recognition.continuous = true;
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.start();
});

// Color options
$('.chat_color').click(function (e) {
    $('.fabs').removeClass(localStorage.getItem('fab-color'));
    $('.fabs').addClass($(this).attr('color'));
    localStorage.setItem('fab-color', $(this).attr('color'));
});

$('.chat_option').click(function (e) {
    $(this).toggleClass('is-dropped');
});

//Loader effect
function loadBeat(beat) {
    beat ? $('.chat_loader').addClass('is-loading') : $('.chat_loader').removeClass('is-loading');
}

// Ripple effect
var target, ink, d, x, y;
$('.fab').click(function (e) {
    target = $(this);
    //create .ink element if it doesn't exist
    if (target.find('.ink').length == 0) target.prepend("<span class='ink'></span>");

    ink = target.find('.ink');
    //incase of quick double clicks stop the previous animation
    ink.removeClass('animate');

    //set size of .ink
    if (!ink.height() && !ink.width()) {
        //use parent's width or height whichever is larger for the diameter to make a circle which can cover the entire element.
        d = Math.max(target.outerWidth(), target.outerHeight());
        ink.css({
            height: d,
            width: d,
        });
    }

    //get click coordinates
    //logic = click coordinates relative to page - parent's position relative to page - half of self height/width to make it controllable from the center;
    x = e.pageX - target.offset().left - ink.width() / 2;
    y = e.pageY - target.offset().top - ink.height() / 2;

    //set the position and add class .animate
    ink.css({
        top: y + 'px',
        left: x + 'px',
    }).addClass('animate');
});

//Cookies handler
function createCookie(name, value, days) {
    var expires;

    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = '; expires=' + date.toGMTString();
    } else {
        expires = '';
    }
    document.cookie = encodeURIComponent(name) + '=' + encodeURIComponent(value) + expires + '; path=/';
}

function readCookie(name) {
    console.log(name);
    var nameEQ = encodeURIComponent(name) + '=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) > -1) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name, '', -1);
}

//User login
function logUser() {
    hideChat(true);
    $('#chat_send_email').click(function (e) {
        var email = $('#chat_log_email').val();
        if (jQuery.trim(email) !== '' && validateEmail(email)) {
            $('.chat_login_alert').html('');
            loadBeat(true);
            createCookie('fab_chat_email', email, 100);
            if (checkEmail(email)) {
                //email exist and get and set username in session
                hideChat(false);
            } else {
                setTimeout(createUsername, 3000);
            }
        } else {
            $('.chat_login_alert').html('Invalid email.');
        }
    });
}

function createUsername() {
    loadBeat(false);
    $('#chat_log_email').val('');
    $('#chat_send_email').children('i').removeClass('zmdi-email').addClass('zmdi-account');
    $('#chat_log_email').attr('placeholder', 'Username');
    $('#chat_send_email').attr('id', 'chat_send_username');
    $('#chat_log_email').attr('id', 'chat_log_username');
    $('#chat_send_username').click(function (e) {
        var username = $('#chat_log_username').val();
        if (jQuery.trim(username) !== '') {
            loadBeat(true);
            if (checkUsername(username)) {
                //username is taken
                $('.chat_login_alert').html('Username is taken.');
            } else {
                //save username in DB and session
                createCookie('fab_chat_username', username, 100);
                hideChat(false);
            }
        } else {
            $('.chat_login_alert').html('Please provide username.');
        }
    });
}

function hideChat(hide) {
    if (hide) {
        $('.chat_converse').css('display', 'none');
        $('.fab_field').css('display', 'none');
    } else {
        $('#chat_head').html(readCookie('fab_chat_username'));
        // Help
        $('#fab_help').click(function () {
            userSend('Help!');
        });
        $('.chat_login').css('display', 'none');
        $('.chat_converse').css('display', 'block');
        $('.fab_field').css('display', 'inline-block');
    }
}

function checkEmail(email) {
    //check if email exist in DB
    return false;
}

function checkUsername(username) {
    //check if username exist in DB
    return false;
}

function validateEmail(email) {
    var emailReg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
    if (!emailReg.test(email)) {
        return false;
    } else {
        return true;
    }
}

if (readCookie('fab_chat_username') === null || readCookie('fab_chat_email') === null) {
    logUser();
} else {
}

hideChat(false);
