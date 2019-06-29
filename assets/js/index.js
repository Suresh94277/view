$(function() {
    const serialize = location.href.split('?');
    let data = 1 in serialize ? serialize[1].split('&') : [];
    data = data.map(x => x.replace(/serial_num=/, '').replace(/dob=/, ''))
    $.get({
        url: 'http://localhost:5000/api/auth/check',
        // contentType: false,
        beforeSend(xhr) {
            const token = localStorage.getItem('token');
            xhr.setRequestHeader('Authorization', 'Bearer '+ token);
        }
    }).then( response => {

        if(response.auth) {
            if(['admin', 'teacher'].indexOf(response.user.role.toLowerCase()) !== -1) {
                // location.href = 'adminPanel-students.html'; 
            }
            let username = response.user.name;
            if(response.user.notifications) {
                username += ' <span class="badge badge-primary badge-pill">'
                + response.user.notifications 
                +'</span>'
                fetchUserNotifications(response.user);
            }
            $('.user-name').html(username);
            $('.user-det'+ (response.user.role=='guest'?':not(.admin-panel)':'')).css('display', 'inline-block');
            $('.log-in').hide();

        } else {
            // location.href = 'login.html';
        }

    });

    (function() {
        $('#result-check-form').find('[name]').each((i, elem) => {
            $(elem).val(data[i]);
            if(i > 0 && i in data) {
                $('.infodob').show();
            }
        });

        $.get('http://localhost:5000/api/results/findBySerialNum/'+ data.join('/'))
        .then(msg => {
          if(typeof msg === 'string') {
            $('.result-container').text(msg)
          }
          if(msg && msg.subjects && msg.subjects.length) {

            const tableBody = $('table#prime1 tbody');
            let subjectbody = '';
            let subject_total = 0;
            let pass_total = 0;
            let obtained_total = 0;
            let total_total = 0;
            let obtained_percentage;
            $.each(msg.subjects, function(rowNumber, subject) {
                subjectbody += `<tr data-row="${rowNumber+1}">
                                <td>${subject.subject}</td>
                                <td>100</td>
                                <td>40</td>
                                <td>${subject.obtained_marks}</td>
                                <td>${subject.total_marks}</td>
                                <td>${subject.remarks}</td>
                            </tr>`;
                subject_total += 100;
                pass_total += 40;
                obtained_total += Number(subject.obtained_marks);
                total_total += Number(subject.total_marks);
            });
            tableBody.html(subjectbody);
            const table = $('table#prime1');
            table.find('tfoot tr:first-child .subject_total').text(subject_total);
            table.find('tfoot tr:first-child .pass_total').text(pass_total);
            table.find('tfoot tr:first-child .obtained_total').text(obtained_total);
            table.find('tfoot tr:first-child .total_total').text(total_total);
            obtained_percentage = obtained_total / subject_total * 100;
            table.find('tfoot tr:first-child .obtained_percentage').text(obtained_percentage + '%');
            $('table#prime1').show()
          }
        });
    })()
});

function logoutMe() {
    localStorage.removeItem('token');
    location.reload();
}

function fetchUserNotifications(user) {
    $.get('http://localhost:5000/api/results/notifications/'+ user._id)
    .then(notifications => {
        notifications = notifications.map(x => `<div class="toast show p-2 mb-2" style="font-size: 13px">
            ${x.message}
            </div>`);
        $('.notifications').html(notifications);
    });
}

function copyToClipboard(text) {
  var $temp = $("<input>");
  $("body").append($temp);
  $temp.val(text).select();
  document.execCommand("copy");
  $temp.remove();


  toastr.success('Link is copied to clipboard.');
}

function writeFeedback() {
    const serial_num = $('[name="serial_num"]').val();
    $.get({
        url: 'http://localhost:5000/api/results/feedbacks/'+ serial_num,
        beforeSend(xhr) {
            const token = localStorage.getItem('token');
            xhr.setRequestHeader('Authorization', 'Bearer '+ token);
        }
    }).then(feedbacks => {
        let body = '';
        for(let feed of feedbacks) {
            body += `<div class="mt-3">
                          <div class="card">
                              <div class="card-body text-left">
                                  ${feed.feedback}
                                  <div class="text-muted mt-2">
                                      ${moment(feed.createdAt).format('MM/DD/YYYY')} - ${feed.user.name}
                                  </div>
                              </div>
                          </div>
                      </div>`;
        }
        const row = `<tr class="feedbacks">
                      <td colspan="6">
                          <div class="mt-3">
                              <div class="card">
                                  <div class="card-body text-left">
                                      <form action="javascript:;" id="feedback-form">
                                          <textarea class="form-control" name="feedback" rows="5" placeholder="Write here"></textarea>
                                          <button type="submit" class="btn btn-success btn-sm mt-3">Post</button>
                                      </form>
                                  </div>
                              </div>
                          </div>
                          ${body}
                      </td>
                  </tr>`;
        $('table#prime1 tfoot tr.feedbacks').remove();
        $('table#prime1 tfoot').append(row);
    })
}

$(document).on('submit', '#feedback-form', function(e) {
    e.preventDefault();
    const data = $(this).serializeArray();
    data.push({name: 'serial_number', value: $('[name="serial_num"]').val()});
    $.post({
        url: 'http://localhost:5000/api/results/feedback-save',
        data,
        beforeSend(xhr) {
            const token = localStorage.getItem('token');
            xhr.setRequestHeader('Authorization', 'Bearer '+ token);
        }
    }).then(response => {
        toastr.success(response.message);
        writeFeedback();
    });
});