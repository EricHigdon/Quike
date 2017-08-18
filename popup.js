var wrikeAuth = new OAuth2('wrike', {
        client_id: 'rR5rgzLS',
        client_secret: 'NVZJnlIEIZrCtZge3fdnR3aHZ7umzqBTV2psfjvBG42skw4Axivezs0hy2mpxFuk',
        api_scope: 'https://www.wrike.com/api/v3/'
    }),
    expired = false,
    now = new Date(),
    today = now.setUTCHours(0, 0, 0, 0),
    thisWeek = {
        "start": new Date (Date.parse('last monday').setUTCHours(0, 0, 0, 0)),
        "end": new Date(Date.parse('friday').setUTCHours(0, 0, 0, 0)),
        "real_end": new Date(Date.parse('saturday'))
    },
    staticDate = new Date(),
    userInfo = {},
    folders = {},
    todays_time = {},
    tasks = {},
    workFlows = {},
    colors = {};

//Check if today is Monday
if(Date.today().toString("ddd") == "Mon") {
    thisWeek.start = new Date(Date.today().setUTCHours(0, 0, 0, 0));
}
//Get the user profile
function getUser()  {
    function display_user() {
        userInfo = JSON.parse(localStorage.user);
        $('#profileImg').attr('src', userInfo.profileImage).attr('alt', userInfo.name);
        $('#profileName').html(userInfo.name);
        getFolders();
    }

    if(localStorage.user == undefined || expired)
    {
        $.ajax({
            url: "https://www.wrike.com/api/v3/contacts?me=true",
            dataType: "json",
            beforeSend: function (request)  {
                request.setRequestHeader("Authorization", "bearer "+wrikeAuth.getAccessToken());
            },
            success: function(data) {
                data = data.data[0];
				console.log(data);
                var userData = {
                    "wrike_id": data.id,
                    "wrike_account_id": data.profiles[0].accountId,
                    "profileImage": data.avatarUrl,
                    "name": data.firstName,
                };
                localStorage.setItem("user", JSON.stringify(userData));
                display_user();
            }
        });
    }
    else
    {
        display_user();
    }
}
//Get all folders in the account
function getFolders()   {
    function load_folders() {
        folders = JSON.parse(localStorage.folders);
        getWorkFlows();
    }
    if(localStorage.folders == undefined || expired || localStorage.root_foleder_id == undefined)
    {
        $.ajax({
            url: "https://www.wrike.com/api/v3/accounts/"+userInfo.wrike_account_id+"/folders",
            dataType: "json",
            beforeSend: function(request)   {
                request.setRequestHeader("Authorization", "bearer "+wrikeAuth.getAccessToken());
            },
            success: function(data) {
                $.each(data.data, function() {
                    if(this.title != "Root")
                        folders[this.id] = this;
					else
						localStorage.setItem('root_folder_id', this.id)
                });
                localStorage.setItem("folders", JSON.stringify(folders));
                load_folders();
            }
        });
    }
    else
    {
        load_folders();
    }
}
//Get Workflows
function getWorkFlows() {
    function load_workflows() {
        workFlows = JSON.parse(localStorage.worflows);
        getColors();
    }
    if(localStorage.workflows == undefined || expired)
    {
        $.ajax({
            url: "https://www.wrike.com/api/v3/accounts/"+userInfo.wrike_account_id+"/workflows",
            dataType: "json",
            beforeSend: function(request)   {
                request.setRequestHeader("Authorization", "bearer "+wrikeAuth.getAccessToken());
            },
            success: function(data) {
                $.each(data.data, function() {
                    $.each(this.customStatuses, function(index) {
                        this.order = index;
                        workFlows[this.id] = this;
                    });
                });
                localStorage.setItem("worflows", JSON.stringify(workFlows));
                load_workflows();
            }
        });
    }
    else
    {
        load_workflows();
    }
}
//Get Colors
function getColors() {
    function load_colors() {
        colors = JSON.parse(localStorage.colors);
        var styles = "<style>"
        $.each(colors, function () {
            var RGBColor = hexToRgb(this.hex),
                convertedColor = [];
            $.each(RGBColor, function (index) {
                convertedColor[index] = Math.round((255+this)/2);
            });
            styles += "."+this.name+"{ background-color: rgb("+convertedColor.join()+"); } ";
        });
        styles += "</style>";
        $("head").append(styles);
		getTasks();
    }

    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : null;
    }
    if(localStorage.colors == undefined || expired)
    {
        $.ajax({
            url: "https://www.wrike.com/api/v3/colors",
            dataType: "json",
            beforeSend: function(request)   {
                request.setRequestHeader("Authorization", "bearer "+wrikeAuth.getAccessToken());
            },
            success: function(data) {
                localStorage.setItem("colors", JSON.stringify(data.data))
                load_colors();
            }
        });
    }
    else
    {
        load_colors();
    }
}
function sortItems(a, b) {
    var wfA = workFlows[a.customStatusId],
        wfB = workFlows[b.customStatusId];

    if (!folders[a.parentIds[0]]) {
        if(a.superParentIds.length > 0) {
            try {
                folderA = folders[a.superParentIds[0]].title;
            }
            catch(e) {
                console.log(e, "Folder with ID "+a.superParentIds[0]+" not found.");
                folderA = "0000AAAA-Undefined";
            }
        }
        else {
            //Root folder goes first
            folderA = "0000AAAAA-Root";
        }
    }
    else {
        folderA = folders[a.parentIds[0]].title;
    }

    if (!folders[b.parentIds[0]]) {
        if(b.superParentIds.length > 0) {
            try {
                folderB = folders[b.superParentIds[0]].title;
            }
            catch(e) {
                console.log(e, "Folder with ID "+a.superParentIds[0]+" not found.");
                folderB = "0000AAAA-Undefined";
            }
        }
        else {
            //Root folder goes first
            folderB = "0000AAAAA-Root";
        }
    }
    else {
        folderB = folders[b.parentIds[0]].title;
    }
    if(wfA == undefined)
    {
        wfA = {
            'order': 0,
            'name': 'A'
        }
    }
    if(wfB == undefined) {
        wfB = {
            'order': 0,
            'name': 'A'
        }
    }
    if (wfA.order == wfB.order) {
        if (wfA.name < wfB.name) {
            return -1;
        }
        else if(wfA.name > wfB.name) {
            return 1;
        }
        else if (folderA < folderB) {
            return -1;
        }
        else if (folderA > folderB) {
            return 1;
        }
        else if (a.title < b.title) {
            return -1;
        }
        else if (a.title > b.title) {
            return 1;
        }
        else {
            return 0;
        }
    }
    else {
        return (wfA.order - wfB.order);
    }
}
//Add Folders
function addFolders(task) {
    var addedFolders = [];
    html = "<div class='parents'>";
    if(task.parentIds.length > 0)   {
        $.each(task.parentIds, function() {
            if(folders[this]) {
                addedFolders.push(this.toString());
                try {
                    html += "<div class='taskParent' data-id='"+folders[this].id+"'>"+folders[this].title+"</div>";
                }
                catch(e) {
                    console.log("Folder with id "+this+" not found. ");
                }
            }
        });
    }
    if(task.superParentIds.length > 0) {
        $.each(task.superParentIds, function() {
            if(folders[this] && !addedFolders.includes(this.toString())) {
                addedFolders.push(this.toString());
                try {
                    html += "<div class='taskParent' data-id='"+folders[this].id+"'>"+folders[this].title+"</div>";
                }
                catch(e) {
                    console.log("Folder with id "+this+" not found");
                }
            }
        });
    }
    html += "</div>";
    return html;
}
//Get User Tasks
function getTasks() {
    $.ajax({
        url: "https://www.wrike.com/api/v3/tasks?status=['active']&fields=['parentIds', 'superParentIds']&responsibles=['"+userInfo.wrike_id+"']",
        dataType: "json",
        beforeSend: function(request) {
            request.setRequestHeader("Authorization", "bearer "+wrikeAuth.getAccessToken());
        },
        success: function(data) {
            data = data.data.sort(sortItems);
            for(task in data)   {
                task = data[task];
                html = "<div class='task' id='task_"+task.id+"'><div class='tags'>";
                if (workFlows[task.customStatusId] != undefined) {
                    html += "<div class='status ";
                    if(workFlows[task.customStatusId].color != undefined) {
                        html += workFlows[task.customStatusId].color;
                    }
                    html += "' >"+workFlows[task.customStatusId].name+"</div>";
                }
                //add Parent folders if they exist
                html += addFolders(task);
                html += "</div><a href='"+task.permalink+"'target='_blank'>";
                html +="<div class='timeLog'></div><h3>"+task.title+"</h3>";
                html += "</a>";
                html += "</div><div class='footer'>";
				html += "<a id='add' class='addTask'><span class='plus'>+</span> New task</a>";
				html += "</div>";
                $("#tasks").append(html);
            }
            var popup = "<div class='statusPopup'><li>Ready For Testing</li><li>Active</li></div>";
            getHours();
        }
    });
}
//Get Time Log
function getHours() {
    $.ajax({
        url: 'https://www.wrike.com/api/v3/accounts/'+userInfo.wrike_account_id+'/timelogs?me=true',
        dataType: "json",
        beforeSend: function(request)   {
            request.setRequestHeader("Authorization", "bearer "+wrikeAuth.getAccessToken());
        },
        success: function(data) {
            today = new Date(today);
            var today_str = today.toJSON(),
                weekStart_str = new Date(thisWeek.start).toJSON(),
                weekEnd_str = new Date(thisWeek.end).toJSON();
            todays_time = data.data.filter(function(today_log) {
                var thisDate = new Date(today_log.trackedDate).toJSON();
                return thisDate === today_str;
            }),
            week_time = data.data.filter(function(today_log) {
                var thisDate = new Date(today_log.trackedDate).toJSON();
                return thisDate >= weekStart_str && thisDate <= weekEnd_str;
            });
            $.each(data.data, function() {
                var that = this,
                    timeLogged = "",
                    hours = 0,
                    thisWeekTimeLog,
                    thisTimeLog = data.data.filter(function(timeLog){
                        return timeLog.taskId === that.taskId;
                    });
                $.each(thisTimeLog, function() {
                    hours += this.hours;
                });
            });
            loadTimeData();
        }
    });
}

function getTasksById(timeLog, callback) {
    taskIds = "";
    $.each(timeLog, function() {
        taskIds += this.taskId+",";
    });
    $.ajax({
        url: 'https://www.wrike.com/api/v3/tasks/'+taskIds,
        dataType: 'json',
        beforeSend: function(request) {
            request.setRequestHeader("Authorization", "bearer "+wrikeAuth.getAccessToken());
        },
        success: function(data) {
            callback(data.data);
        }
    });
}

function getFoldersById(folders, callback) {
    folderIds = "";
    $.each(folders, function() {
        folderIds += this+",";
    });
}

function saveTimeLog(logElement, callback) {
    //Add and ajax function to save the new time log
    trackedDate = Date.today().toString("yyyy-M-d");
    $.ajax({
        url: 'http://erichigdon.com/wrike/saveTime.php/',
        data: {
            'accessToken': wrikeAuth.getAccessToken(),
            'timeLog':logElement.attr("data-log-id"),
            'hours':logElement.find("input").val(),
            'trackedDate':trackedDate,
            'comment': logElement.parent().find(".taskDesc").html()
        },
        type: 'POST',
        success: function(data) {
            callback(data);
        },
        error: function(e) {
            console.log(e);
        }
    });
}

function createTask(taskData) {
	console.log(taskData);
	$.ajax({
		url: 'https://www.wrike.com/api/v3/folders/'+localStorage.root_folder_id+'/tasks',
		dataType: 'json',
		type: 'POST',
		data: taskData,
		beforeSend: function(request) {
			request.setRequestHeader("Authorization", "bearer "+wrikeAuth.getAccessToken());
		},
		success: function(data) {
			var url = data.data[0].permalink;
			chrome.tabs.query({'url': 'https://www.wrike.com/*'}, function(tabs) {
				if(tabs.length)
					var tabId = tabs[0].id
				else
					var tabId = 0
				if(tabId)
					chrome.tabs.update(tabId, {'url': url, 'active': true});
				else
					chrome.tabs.create({'url': url});
			});
		}
	});
}
function addTask() {
	chrome.tabs.getSelected(null, function(tab) {
		chrome.tabs.sendMessage(tab.id, {text: 'getWrikeMeta'}, function(response) {
			createTask(response);
		});
	});
}

function getTimeString(hours) {

    var timeLogged = (new Date).clearTime().addHours(hours),
        minutesLogged = Math.round(timeLogged.getMinutes() + (timeLogged.getSeconds() / 60)),
        hoursLogged = timeLogged.getHours();

    if(hours >= 24) {
        var daysLogged = Math.floor(hours / 24);
        hoursLogged += daysLogged * 24;
    }

    if(minutesLogged < 10)
        minutesLogged = "0" + minutesLogged;

    return hoursLogged + ":" + minutesLogged;

}

function updateTime(thisLog) {
    var editInput = thisLog.find("input"),
        thisItem = $("[data-log-id='"+thisLog.attr("data-log-id")+"']");
    thisItem.each(function() {
        var totalHours = 0;
        $(this).attr("data-hours", editInput.val());
        $(this).html(getTimeString(editInput.val()));
        $(this).closest(".page").find(".timeLog").each(function() {
            totalHours += parseFloat($(this).attr("data-hours"));
        });
        $(this).closest(".page").find(".totalHoursSpan").html(getTimeString(totalHours));
    });
}

function loadTasks(timeLog, taskList, callback) {
        var totalHours = 0,
            html = "";
        $.each(timeLog, function() {
            var that = this,
                thisTask = taskList.filter(function(task) {
                    return that.taskId == task.id;
                }),
                task = thisTask[0];

            var timeLoggedStr = getTimeString(that.hours);
            totalHours += that.hours;
            html += "<div class='task' id='task_"+task.id+"'>";
            html += "<div class='timeLog' data-hours='"+that.hours+"' data-log-id='"+that.id+"'>"+timeLoggedStr;
            html += "<input type='text' value='"+that.hours+"' style='display:none;'/></div>"
            html += "<a href='"+task.permalink+"'target='_blank'>";
            html += "<h3>"+task.title+"</h3>";
            html += "</a>";
           //add comment if exists
            if(that.comment != "" && that.comment != undefined) {
                html += "<p class='taskDesc'>"+that.comment+"</p>";
            }
            //add Parent folders if they exist
            html += addFolders(task);
            html += "</div>";
        });
        var totalHoursStr = getTimeString(totalHours);
        html += "<div class='footer'>";
		html += "<a id='add' class='addTask'><span class='plus'>+</span> New task</a>";
		html += "<p class='totalHours'><strong>Total Time: </strong>";
		html += "<span class='totalHoursSpan'>"+totalHoursStr+"</span>";
		html += "</p>";
		html += "</div>";
        callback(html);
        $(".page .timeLog").click(function() {
            var thisLog = $(this);
            if(!thisLog.hasClass("editing")){
                thisLog.addClass("editing");
                thisLog.find("input").fadeIn();
                var editInput = thisLog.find("input");
                editInput.focus();
                editInput.bind("blur keyup", function(e) {
                    if(e.type == "blur" || e.keyCode == "13") {
                        var inputItem = $(this);
                        inputItem.fadeOut();
                        if($(this).val() != thisLog.attr('data-hours')) {
                            saveTimeLog(thisLog, function(responseData) {
                                //This will run after the ajax call is finished.
                                updateTime(thisLog);
                                thisLog.removeClass("editing");
                            });
                        }
                        else {
                            thisLog.removeClass("editing");
                        }
                    }
                });
            }
        });
}

function loadTimeData() {

    getTasksById(todays_time, function(taskList) {
        loadTasks(todays_time, taskList, function(html) {
            $("#day").append(html);
        });
    });

    getTasksById(week_time, function(taskList) {
        loadTasks(week_time, taskList, function(html) {
            $("#week").append(html);
        });
    });
}

function showTasksPage() {
    $('.page#day').slideUp();
    $('.page#week').slideUp();
    $('.page#tasks').delay(400).slideDown();
    $('.page#loading').delay(800).fadeOut();
    localStorage.setItem("current_page", "tasks");
}
function showDayPage() {
    $('.page#week').slideUp();
    $('.page#tasks').slideUp();
    $('.page#day').delay(400).slideDown();
    $('.page#loading').delay(800).fadeOut();
    localStorage.setItem("current_page", "day");
}
function showWeekPage() {
    $('.page#day').slideUp();
    $('.page#tasks').slideUp();
    $('.page#week').delay(400).slideDown();
    $('.page#loading').delay(800).fadeOut();
    localStorage.setItem("current_page", "week");
}

wrikeAuth.authorize(function() {
      // Ready for action
    if(localStorage.cache_expires == undefined || new Date(JSON.parse(localStorage.cache_expires)) < now)
    {
        expired = true;
        localStorage.setItem("cache_expires", JSON.stringify(Date.today().add(3).days()))
        console.log("Rebuilding cache");
    }
    getUser();
    $('nav ul.nav li').click(function() {
        $("nav ul.nav li.active").removeClass("active");
        $(this).addClass("active");
        switch($(this).find("a").attr("href")) {
            case "#tasks":
                showTasksPage();
                break;
            case "#day":
                showDayPage();
                break;
            case "#week":
                showWeekPage();
				break;
        }
    });
    $( document ).ajaxComplete(function() {
        if(localStorage.current_page)
            $("a[href='#"+localStorage.current_page+"'").click();
        else
            showDayPage();
    });
	$('body').on('click', '#add', function() {
		addTask();
	});
});
