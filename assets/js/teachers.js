$(function(Table, mytoken) {

    const Datatable = Table.KTDatatable({
        data: {
            type: 'remote',
            source: {
                read: {
                    url: 'http://localhost:5000/api/teachers/datatable',
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
            { title: 'Name', field: 'name', width: 150},
            { title: 'Role', field: 'role', width: 100 },
            { title: '&nbsp;', field: 'action', width: 90, textAlign: 'right',
                template({_id}) {
                    const role = localStorage.getItem('user_role');
                    return role === 'admin' ? `<button type="button" class="sm-btn btn btn-accent btn-pill btn-sm btn-icon btn-icon--only"
                    data-toggle="modal" data-id="${_id}" data-target="#teacher-edit-modal">
                        <i class="fa-sm fa fa-eye"></i>
                    </button>` : '';
                }
            }
        ]
    });

    $('.refreshTable').on('click', function() {
        Datatable.reload();
    });

    window.reloadTeachers = function() {
        Datatable.reload();
    }

    $(document).on('click', '[data-target="#teacher-edit-modal"]', function(e) {
        const id = $(this).attr('data-id');
        $('#teacher-edit-form').attr('data-id', id);
        $.get('http://localhost:5000/api/teachers/findById/' + id)
        .then(student => {
            const targetModal = $('#teacher-edit-form');
            for (let [name, value] of Object.entries(student)) {
                targetModal.find('input[name="'+ name +'"]').val(value);
                targetModal.find('select[name="'+ name +'"]').val(value).selectpicker('refresh');
            }
        });
    });
    
}( $('#teacherTable'), localStorage.getItem('token') ));