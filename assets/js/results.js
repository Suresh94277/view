$(function(Table, mytoken) {

    const Datatable = Table.KTDatatable({
        data: {
            type: 'remote',
            source: {
                read: {
                    url: 'http://localhost:5000/api/results/datatable',
                    method: 'get',
                    headers: {
                        "authorization": "bearer "+ mytoken
                    }
                }
            },
            pageSize: 10,
            saveState: false
        },
        pagination: true,
        sortable: true,
        rows: {
            autoHide: false
        },
        toolbar: {
            items: {
                pagination: {
                    pageSizeSelect: [10,20,30,50,100]
                }
            }
        },
        layout: {
            icons : {
                pagination : {
                    next: 'fa fa-angle-right fa-lg',
                    prev: 'fa fa-angle-left fa-lg',
                    first: 'fa fa-angle-double-left fa-lg',
                    last: 'fa fa-angle-double-right fa-lg',
                    more: 'fa fa-ellipsis-h fa-lg'
                }
            }
        },
        columns: [
            { title: 'Date', field: 'date', width: 100,
                template({date}) {
                    return moment(date).format('MM/DD/YYYY');
                }
            },
            { title: 'Exam', field: 'term', width: 100},
            { title: 'Name', field: 'student.fname', width: 150,
                template({student}) {
                    return [student.fname, student.mname, student.lname].join(' ');
                }
            },
            { title: 'Class', field: 'standard', width: 50
            },
            { title: 'Parent', field: 'parent_name', width: 150,
                template({student}) {
                    return student.parent_name;
                }
            },
            { title: 'Pass/Fail', field: 'status', width: 80,
                template({subjects}) {
                    const failed = subjects.filter(x => x.obtained_marks < x.pass_marks)
                    return failed.length ? '<span class="text-danger">Failed</span>' 
                            : '<span class="text-success">Pass</span>'
                }
            },
            { title: '&nbsp;', field: 'action', width: 90, textAlign: 'right',
                template({_id}) {
                    return `<button type="button" class="sm-btn btn btn-accent btn-pill btn-sm btn-icon btn-icon--only"
                    data-toggle="modal" data-id="${_id}" data-target="#result-edit-modal">
                        <i class="fa-sm fa fa-eye"></i>
                    </button>&nbsp;&nbsp;<button type="button" class="sm-btn btn deleteResAction btn-danger btn-pill btn-sm btn-icon btn-icon--only"
                     data-id="${_id}">
                        <i class="fa-sm fa fa-trash"></i>
                    </button>`;
                }
            }
        ]
    });

    $('.refreshTable').on('click', function() {
        Datatable.reload();
    });

    window.reloadResults = function() {
        Datatable.reload();
    }

    $('#exam-date').datepicker({
        format: 'mm/dd/yyyy',
        autoclose:true
    }).on('change', function(e) {
        Datatable.search(new Date(this.value), 'date');
    });

    $('#exam-term').on('change', function(e) {
        Datatable.search(this.value, 'term');
    });

    $('#exam-class').on('change', function(e) {
        Datatable.search(this.value, 'standard');
    });
    $('#exam-student-name').on('keyup', function(e) {
        Datatable.search(this.value, 'student.fname');
    });

    $(document).on('click', '[data-target="#result-edit-modal"]', function(e) {
        const id = $(this).attr('data-id');
        $('#result-edit-form').attr('data-id', id);
        $.get('http://localhost:5000/api/results/findById/' + id)
        .then(result => {
            const targetModal = $('#result-edit-form');
            for (let [name, value] of Object.entries(result)) {
                if (name === 'date') {
                    value = moment(value).format('MM/DD/YYYY');
                }
                targetModal.find('input[name="'+ name +'"]').val(value);
                // targetModal.find('select[name="'+ name +'"]').val(value).selectpicker('refresh');
                if (name === 'student') {
                    value = [value.fname, value.mname, value.lname].join(' ');
                    targetModal.find('input[name="student_id"]').val(value);
                }
                if (name === 'subjects') {
                    const tableBody = $('table#prime1 tbody');
                    let subjectbody = '';
                    $.each(value, function(rowNumber, subject) {
                        subjectbody += `<tr data-row="${rowNumber+1}">
                                        <td><select data-value="${subject.subject}" name="subjects[subject][]" class="result-subject form-control" title="Choose subject">
                                            
                                        </select></td>
                                        <td>100 <input type="hidden" name="subjects[full_marks][]" value="100"></td>
                                    <td>40 <input type="hidden" name="subjects[pass_marks][]" value="40"></td>
                                        <td><input type="text" value="${subject.obtained_marks}" name="subjects[obtained_marks][]" class="form-control" style="width: 80px;"></td>
                                        <td><input type="text" value="${subject.total_marks}" name="subjects[total_marks][]" class="form-control" style="width: 80px;"></td>
                                        <td><textarea name="subjects[remarks][]" class="form-control" rows="1">${subject.remarks}</textarea></td>
                                    </tr>`;
                    });
                    tableBody.html(subjectbody);

    
                    $.get('http://localhost:5000/api/classes/subjects').then(list => {
                        list = list.map(x => `<option value="${x}">${x}</option>`);
                        $('select.result-subject').html(list).each(function() {
                            $(this).selectpicker({width: '100%'});
                            $(this).selectpicker('val', $(this).attr('data-value'));
                        });
                    });
                }
            }
            for (let [name, value] of Object.entries(result.student)) {
                if (name === 'dob') {
                    value = moment(value).format('MM/DD/YYYY');
                }
                targetModal.find('input[name="student['+ name +']"]').val(value);
                // targetModal.find('select[name="['+ name +']"]').val(value).selectpicker('refresh');
            }
            calcTotal('table#prime1');
        });
    });

    $(document).on('click', '.deleteResAction', function (e){
        const id = $(this).attr('data-id');
        if(!confirm('Do you really want to delete this?')) return;
        $.post({
            url: 'http://localhost:5000/api/results/delete/'+ id,
            beforeSend(xhr) {
                const token = localStorage.getItem('token');
                xhr.setRequestHeader('Authorization', 'Bearer '+ token);
            }
        })
        .then(response => {
            toastr.success('Result deleted successfully.');
            $('.modal.show').modal('hide');
            reloadResults();
        }, err => {
            toastr.error('Something went wrong.');
        });
    });
    
}( $('#resultTable'), localStorage.getItem('token') ));

function calcTotal(tableId = 'table#prime')
{
    const table = $(tableId);
    let obtained_total = 0;
    let total = 0;
    let subject_total = 0;
    let pass_total = 0;
    table.find('tbody tr').each((i, row) => {
        let ot = $(row).find('[name="subjects[obtained_marks][]"]').val();
        obtained_total += Number(ot);
        total += Number(ot);
        $(row).find('[name="subjects[total_marks][]"]').val(ot);
        pass_total   += 40;
        subject_total += 100;
    });
    table.find('tfoot tr .subject_total').text(subject_total);
    table.find('tfoot tr .pass_total').text(pass_total);
    table.find('tfoot tr .obtained_total').text(obtained_total);
    table.find('tfoot tr .total_total').text(total);
    table.find('tfoot tr .obtained_percentage').text((obtained_total / subject_total * 100).toFixed(2) + '%');
}

$(document).on('change', 'table#prime [name="subjects[obtained_marks][]"]', function(e) {
    calcTotal();
});