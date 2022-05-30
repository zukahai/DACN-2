$(document).ready(function () {
    $('.message').hide();
    $('.information').hide();
    $('.icon-spin').hide();
    $('.sender_psid').change(function () {
        let sender_psid = $('.sender_psid').val();
        $('.spin').show();
        $.ajax({
            url: '/get-user',
            type: 'POST',
            dataType: 'json',
            data: {
                sender_psid: sender_psid,
            },
            success: function (data) {
                $('.information').show();
                console.log(data.data.name);
                if (data.data.name != undefined) {
                    $('.spin').hide();
                    $('.image_avatar').attr('src', data.data.profile_pic);
                    $('.card-username').text(data.data.name);
                    $('.first_name').text('Tên ' + data.data.first_name);
                    $('.last_name').text('Họ ' + data.data.last_name);
                } else {
                    $('.name_user').val('Không có tài khoản');
                    $('.information').hide();
                }
            },
        });
    });

    $('.form-sender').submit(function (e) {
        e.preventDefault();

        let sender_psid = $('.sender_psid').val();

        if (sender_psid.length > 0) {
            $('.message').removeClass('alert-danger').addClass('alert-success');
            $('.spin').show();
            $('.text strong').text(``);
            $('.text span').text(``);
            $('.message').show();
            $('.progress-barrr').css({
                width: 0 + '%',
            });
            $.ajax({
                xhr: function () {
                    var xhr = new window.XMLHttpRequest();
                    xhr.upload.addEventListener(
                        'progress',
                        function (evt) {
                            if (evt.lengthComputable) {
                                var percentComplete = evt.loaded / evt.total;
                                $('.progress-barrr').css({
                                    width: percentComplete * 100 + '%',
                                });
                                $('.progress-barrr').text(percentComplete * 100 + '%');
                            }
                        },
                        false,
                    );
                    xhr.addEventListener(
                        'progress',
                        function (evt) {
                            if (evt.lengthComputable) {
                                var percentComplete = evt.loaded / evt.total;
                                $('.progress-barrr').css({
                                    width: percentComplete * 100 + '%',
                                });
                                $('.progress-barrr').text(percentComplete * 100 + '%');
                            }
                        },
                        false,
                    );
                    return xhr;
                },
                url: '/send-message',
                type: 'POST',
                dataType: 'json',
                data: {
                    sender_psid: sender_psid,
                    data_message: $('.data_message').val(),
                    data_multi: $('.data-multi').prop('checked'),
                },
                success: function (data) {
                    console.log(data);
                    $('.spin').hide();
                    if (data.data.error === 'success') {
                        $('.message').removeClass('alert-danger').addClass('alert-success');
                        $('.text strong').text(data.data.user_name);
                        $('.text span').text('Gửi thành công đến tài khoản');
                    } else if (data.data.error === 'No Sender') {
                        $('.message').removeClass('alert-success').addClass('alert-danger');
                        $('.text span').text('Không có tài khoản có PSID');
                        $('.text strong').text(`${sender_psid}`);
                    }
                },
            });
        } else {
            alert('Chưa nhập PSID');
        }
    });
});
