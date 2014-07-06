var Todo = function(data) {
    this.title = ko.observable(data.title);
    this.date = ko.observable(data.date);
    this.details = ko.observable(data.details);
    this.completed = ko.observable(data.completed);
};

var TodoViewModel = function(todos) {
    var self = this;

    // сохранять данные в LocalStorage
//    self.todos = ko.observableArray(todos, {persist: 'todos'});
    // TODO: как сохранить в LocalStorage ko.observableArray( k: ko.observable() ) и потом вернуть обратно как observable?

    self.todos = ko.observableArray(todos);

    // отображение формы
    self.displayForm = ko.observable(false);
    self.displayButton = ko.observable(true);
    self.showForm = function () {
        self.displayForm(true).displayButton(false);
    };
    self.hideForm = function () {
        self.displayForm(false).displayButton(true);
    };

    // Фильтры
    self.filterByTitle = ko.observable();
    self.filterByDate1 = ko.observable();
    self.filterByDate2 = ko.observable();
    self.activeFilter = ko.observable();

    self.filters = [
        {title: 'All', key: 'all', isSelected: ko.observable(false)},
        {title: 'Active', key: 'active', isSelected: ko.observable(false)},
        {title: 'Completed', key: 'completed', isSelected: ko.observable(false)},
        {title: 'Expired', key: 'expired', isSelected: ko.observable(false)}
    ];

    self.chooseStatus = function(data) {
        self.activeFilter(data.key);
        return true;
    };

    self.filteredTodos = ko.computed(function () {
        var currentList = self.todos();

        // фильтровать по названию
        if (self.filterByTitle()) {
            currentList = ko.utils.arrayFilter(currentList, function (todo) {
                return todo.title().toLowerCase().indexOf(self.filterByTitle().toLowerCase()) >= 0;
            });
        }

        // фильтровать по дате
        if (self.filterByDate1() || self.filterByDate2()) {
            currentList = ko.utils.arrayFilter(currentList, function (todo) {
                var d = new Date(todo.date().split('.').reverse());
                var start = self.filterByDate1()? new Date(self.filterByDate1().split('.').reverse()).getTime() : null;
                var end = self.filterByDate2()? new Date(self.filterByDate2().split('.').reverse()).getTime() : null;

                if (start && end) {
                    return start <= d && d <= end;
                }
                else if (start && !end) {
                    return start <= d;
                }
                else if (!start && end) {
                    return d <= end;
                }
            });
        }

        // фильтровать по статусу
        switch (self.activeFilter()) {
            case 'all':
                break;
            case 'active':
                currentList = ko.utils.arrayFilter(currentList, function (todo) {
                    return !todo.completed();
                });
                break;
            case 'completed':
                currentList = ko.utils.arrayFilter(currentList, function (todo) {
                    return todo.completed();
                });
                break;
            case 'expired':
                currentList = ko.utils.arrayFilter(currentList, function (todo) {
                    return todo.date() && (new Date(todo.date().split('.').reverse()).getTime() - (new Date()).getTime() < 0);
                });
                break;
        }

        return currentList;
    }).extend({throttle: 300});

    // нажали на чекбокс в списке
    self.checkTodo = function(todo) {
        todo.completed(! (todo.completed()) );
        return true;
    };

    self.removeTodo = function(todo) {
        self.todos.remove(todo);
    };

    // новая форма
    self.newTitle = ko.observable("");
    self.newDate = "";
    self.newDetails = "";
    self.newCompleted = "";

    // сохранить данные формы
    self.saveTodo = function() {
        self.todos.push({
            title       : self.newTitle(),
            date        : ko.observable(self.newDate),
            details     : ko.observable(self.newDetails),
            completed   : ko.observable($("#newCompleted").prop('checked'))
        });
    };

    // сортировка
    self.headers = [
        {title:'Title', sortKey: 'title', asc: false},
        {title:'Date', sortKey: 'date', asc: false},
        {title:'Details', sortKey: 'details', asc: false},
        {title:'Completed', sortKey: null}
    ];

    self.activeSort = self.headers[0];

    self.sort = function(header, event) {
        var sortKey = header.sortKey;

        if (self.activeSort === header) {
            header.asc = !header.asc;
        }
        else {
            self.activeSort = header;
        }

        if (sortKey == 'title' || sortKey == 'details') {
            if (header.asc) {
                self.todos.sort(function (a, b) {
                    return a[sortKey]() < b[sortKey]() ? -1 : 1;
                });
            }
            else {
                self.todos.sort(function (a, b) {
                    return a[sortKey]() > b[sortKey]() ? -1 : 1;
                });
            }
        }
        else if (sortKey == 'date') {
            self.todos.sort(function (a, b) {
                var d1 = new Date(a.date().split('.').reverse()).getTime();
                var d2 = new Date(b.date().split('.').reverse()).getTime();

                if (header.asc) {
                    return d1 < d2 ? -1 : 1;
                }
                else {
                    return d1 > d2 ? -1 : 1;
                }
            });
        }
    };

    self.displayPreview = ko.observable(false);
    self.previewTitle = ko.observable();
    self.previewDate = ko.observable();
    self.previewDetails = ko.observable("");
    self.previewCompleted = ko.observable();

    // область редактирования
    self.displayDetails = ko.observable(false);
    self.displayTitle = ko.observable(false);
    self.displayDate = ko.observable(false);
    self.editTitle = ko.observable();
    self.editDate = ko.observable();
    self.editDetails = ko.observable();
    self.displaySaveBtn = ko.observable(false);

    self.openTodo = function(todo) {
        self.displayPreview(true);
        self.previewTitle(todo.title);
        self.previewDate(todo.date);
        self.previewDetails(markdown.toHTML(todo.details()));
        self.previewCompleted(todo.completed);

        self.editTitle(todo.title);
        self.editDate(todo.date);
        self.editDetails(todo.details);
    };

    ko.computed(function() {
        // показать кнопку сохранить
        if (self.displayTitle() || self.displayDate() || self.displayDetails()) {
            self.displaySaveBtn(true);
        }

        // обновим область просмотра
        if (self.displayDetails()) {
            self.previewDetails(markdown.toHTML(self.editDetails()()));
        }
    });

    // скрываем область редактирования
    self.saveEditForm = function() {
        self.displayTitle(false);
        self.displayDate(false);
        self.displayDetails(false);
        self.displaySaveBtn(false);
    };
};

var viewModel = new TodoViewModel([
    new Todo({title: "todo", date: "27.06.2014", details: "some text", completed: true}),
    new Todo({title: "Abbdo home", date: "02.06.2014", details: "primary: **wash dishes**", completed: false}),
    new Todo({title: "Ree home2", date: "05.07.2014", details: "beewash dishes2", completed: false})
]);

ko.applyBindings(viewModel);

$(".todoForm").validate({ submitHandler: viewModel.saveTodo });
$("#newDate").datepicker();
$("#filterByDate1").datepicker();
$("#filterByDate2").datepicker();

// двойной клик на редактирование
$("#previewTitle").on("dblclick", function(e){
    e.preventDefault();
    viewModel.displayTitle(true);
});
$("#previewDate").on("dblclick", function(e){
    e.preventDefault();
    viewModel.displayDate(true);
    $("#editDate").datepicker();
});
$("#previewDetails").on("dblclick", function(e){
    e.preventDefault();
    viewModel.displayDetails(true);
});