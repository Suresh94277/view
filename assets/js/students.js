$(function(Table, mytoken) {

    const Datatable = Table.KTDatatable({
        data: {
            type: 'remote',
            source: {
                read: {
                    url: 'http://localhost:5000/api/students/datatable',
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
            { title: 'ID', field: 'id', width: 50 },
            { title: 'Image', field: 'image', width: 100,
                template({image}) {
                    return `<img src="http://localhost:5000/api/students/image/${image}" class="img-fluid">`;
                }
            },
            { title: 'Name', field: 'fname', width: 150,
                template({fname, mname, lname}) {
                    return [fname, mname, lname].join(' ');
                }
            },
            { title: 'Class', field: 'standard', width: 50 },
            { title: 'Date of Birth', field: 'dob', width: 100, textAlign: 'center',
                template({dob}) {
                    return moment(dob).format('MM/DD/YYYY');
                }
            },
            { title: 'Parent', field: 'parent_name', width: 150 },
            { title: '&nbsp;', field: 'action', width: 90, textAlign: 'right',
                template({_id}) {
                    return `<button type="button" class="sm-btn btn btn-accent btn-pill btn-sm btn-icon btn-icon--only"
                    data-toggle="modal" data-id="${_id}" data-target="#students-edit-modal">
                        <i class="fa-sm fa fa-eye"></i>
                    </button>&nbsp;&nbsp;<button type="button" class="sm-btn btn deleteStdAction btn-danger btn-pill btn-sm btn-icon btn-icon--only"
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

    window.reloadStudents = function() {
        Datatable.reload();
    }

    $(document).on('click', '[data-target="#students-edit-modal"]', function(e) {
        const id = $(this).attr('data-id');
        $('#student-edit-form').attr('data-id', id);
        $.get('http://localhost:5000/api/students/findById/' + id)
        .then(student => {
            const targetModal = $('#students-edit-modal');
            $('#img-target').attr('src', '');
            for (let [name, value] of Object.entries(student)) {
                targetModal.find('input[name="'+ name +'"]').val(value);
                targetModal.find('select[name="'+ name +'"]').val(value).selectpicker('refresh');
                if(name === 'dob') {
                    $('#student-edit-dob').datepicker('setDate', new Date(value));
                } else if(name === 'image') {
                    // alert(value)
                    $('#img-target').attr('src', 'http://localhost:5000/api/students/image/'+ value);
                }
            }
        });
    });

    $(document).on('click', '.deleteStdAction', function (e){
        const id = $(this).attr('data-id');
        if(!confirm('Do you really want to delete this?')) return;
        $.post({
            url: 'http://localhost:5000/api/students/delete/'+ id,
            beforeSend(xhr) {
                const token = localStorage.getItem('token');
                xhr.setRequestHeader('Authorization', 'Bearer '+ token);
            }
        })
        .then(response => {
            toastr.success('Student deleted successfully.');
            $('.modal.show').modal('hide');
            reloadStudents();
        }, err => {
            toastr.error('Something went wrong.');
        });
    });
    
}( $('#studentTable'), localStorage.getItem('token') ));