"use strict";

var panel = new function() {
  var loadingSlowTimeout;

  var setIframeUrl = function(url) {
    // If the url contains a hash-tag, we must navigate to another page between.
    // See bug #4 on github issues.
    if (url.indexOf("#") != -1) {
      $("#iframe").attr("src", "");
      // We also wait a bit:
      setTimeout(function() {
        $("#iframe").attr("src", url);
      }, 100);
    } else {
      $("#iframe").attr("src", url);
    }
  };

  var changeUrl = function() {
    var search = $("#url").val().match(/^[a-zA-Z]+:\/\//i);

    if (search == null) {
      setIframeUrl("http://" + $("#url").val());
      setLoadingCover();
    } else {
      search = $("#url").val().match(/^local:\/\//i);

      if (search == null) {
        setIframeUrl($("#url").val());
        setLoadingCover();
      } else {
        setIframeUrl( chrome.extension.getURL( $("#url").val().substring(8) ) );

        // If another web page is loading right now, the covers must be removed:
        $("#loading").css("display", "none");
        clearTimeout(loadingSlowTimeout);
        $("#loadingSlow").css("display", "none");
      }
    }
  };

  var setLoadingCover = function() {
    $("#loading").css("display", "block");

    // First clear the timeout if there already is one:
    clearTimeout(loadingSlowTimeout);

    loadingSlowTimeout = setTimeout(function() {
      $("#loadingSlow").css("display", "block");
    }, 8000);
  };

  var handleReceivedLink = function(message, sender) {
    // If the sender doesn't have a frame id, then we know it comes from the sidebar
    if (message.fromCnt && !sender.frameId) {
      $("#url").val(message.link);
      $("#loading").css("display", "none");
      clearTimeout(loadingSlowTimeout);
      $("#loadingSlow").css("display", "none");

      backAndForward.handleHistoryInformation(message.link);
      chrome.storage.local.set({ "lastSite": $("#url").val() });
    }
  };

  var setLastSite = function(object) {
    if ( typeof object.lastSite === "undefined") {
      chrome.storage.local.set({"lastSite": "local://welcome/index.html" });
      $("#url").val("local://welcome/index.html");
      changeUrl();
    } else {
      $("#url").val(object.lastSite);
      changeUrl();
    }
  };

  var searchInsteadClicked = function() {
    $("#iframe").attr("src", "https://www.google.com/#q=" + $("#url").val());
  };

  var enterOnUrlBarPressed = function(event) {
    if ( event.which == 13 ) {
      event.preventDefault();
      changeUrl();
      return false;
    }
  };

  var reloadClicked = function() {
    changeUrl();
  };

  var bindUIActions = function() {
    $("#searchInstead").click(function() { searchInsteadClicked(); });
    $("#reload").click(function() { reloadClicked(); });
    $("#url").keypress(function(event) { enterOnUrlBarPressed(); });
  };

  var init = function() {
    bindUIActions();
    chrome.runtime.onMessage.addListener(function(message, sender) { handleReceivedLink(message, sender); });
    chrome.storage.local.get("lastSite", function(object) { setLastSite(object); });
  };

  init();
};

var urlBar = new function() {

  var bindUIActions = function() {

  };

  var init = function() {
    bindUIActions();
  };

  init();
};

var backAndForward = new function() {
  var historyArray = [];
  var currentPos = -1; // Current position in history

  var getStoredHistoryInformation = function(object) {
    if ( typeof object.historyArray !== "undefined" && typeof object.currentPos !== "undefined") {
      historyArray = object.historyArray;
      currentPos = object.currentPos;
    }
  };

  var backClicked = function() {
    if (currentPos > 0) {
      $("#loading").css("display", "block");
      currentPos --;
      $("#iframe").attr("src", historyArray[currentPos]);
      chrome.storage.local.set({"historyArray": historyArray, "currentPos": currentPos});
    }
  };

  var forwardClicked = function() {
    if (currentPos + 1 != historyArray.length) {
      $("#loading").css("display", "block");
      currentPos ++;
      $("#iframe").attr("src", historyArray[currentPos]);
      chrome.storage.local.set({"historyArray": historyArray, "currentPos": currentPos});
    }
  };

  var bindUIActions = function() {
    $("#back").click(function() { backClicked(); });
    $("#forward").click(function() { forwardClicked(); });
  };

  var init = function() {
    bindUIActions();
    chrome.storage.local.get(["historyArray", "currentPos"], function(object) { getStoredHistoryInformation(object); });
  };

  this.handleHistoryInformation = function (link) {
    // Check if the page was just reloaded:
    if (historyArray[historyArray.length - 1] != link) {
      // Check if the page was navigated to via history buttons. Then it shouldn't be added to history again:
      if (historyArray[currentPos] != link) {
        historyArray.length = currentPos + 1;
        historyArray.push(link);

        // Max length 50:
        if (historyArray.length > 50)
          historyArray.shift();
        else
          currentPos++;

        chrome.storage.local.set({"historyArray": historyArray, "currentPos": currentPos});
      }
    }
  };

  init();
};

var autoReload = new function() {

  var bindUIActions = function() {

  };

  var init = function() {
    bindUIActions();
  };

  init();
};

var bookmarks = new function() {
  var wpb; //web panel bookmarks folder id

  var createBookmark = function() {
    if ($("#url").val() != "") {
      var title = prompt( "Bookmark title:", $("#url").val() );
      if (title == "") {
        alert("Please type a title for the bookmark. Press cancel on the next pop-up to escape.");
        createBookmark();
      } else if (title != null) {
        chrome.bookmarks.create({"parentId": wpb, "url": $("#url").val(), "title": title}, function(result) {
          if (result === undefined)
            alert("Bookmark not created: " + chrome.extension.lastError.message);
        });
        loadBookmarks();
      }
    } else {
      alert("You haven't entered a url.");
    }
  };

  var bindUIActions = function() {

  };

  var init = function() {
    bindUIActions();
  };

  init();
};


















$("#add-bookmark").click(createBookmark);

chrome.bookmarks.search("Web Panel extension", function(list)
{
  if (typeof list[0] === "undefined")
  {
    chrome.bookmarks.create({'title': 'Web Panel extension'}, function(folder)
    {
      wpb = folder.id;
      loadBookmarks();
    });
  }
  else
  {
    chrome.bookmarks.get(list[0].parentId, function(parent)
    {
      if (parent[0].title == "Trash")
      {
        chrome.bookmarks.create({'title': 'Web Panel extension'}, function(folder)
        {
          wpb = folder.id;
          loadBookmarks();
        });
      }
      else
      {
        wpb = list[0].id;
        loadBookmarks();
      }
    });
  }
});

function loadBookmarks()
{
  chrome.bookmarks.getChildren(wpb, function(result)
  {
    var content = "";
    if (result.length == 0)
    {
      content = "<h3 style='margin-left: 10px;'>You have no bookmarks</h3>";
    }
    else
    {
      result.forEach(function(entry)
      {
        if (typeof entry.url === "undefined")
          return; // If it's a folder, skip it

        var re = /(<([^>]+)>)/ig;
        entry.title = entry.title.replace(re, "");
        entry.url = entry.url.replace(re, "");

        // ES6 multi-line string with backticks, Opera 28+:
        content += `<div data-id="` + entry.id + `" title="` + entry.url + `" class="box">
                    <img class="favicon-img" src="http://www.google.com/s2/favicons?domain=` + entry.url + `"></img>
                    <div class="text-box"><p class="link">` + entry.title + `</p></div>
                    </div>`;
      });
    }
    $("#bookmarks-popup").html(content);

    $(".box").on('contextmenu', function(e)
    {
      e.preventDefault();
      chrome.bookmarks.remove( $(this).attr("data-id"), function()
      {
        loadBookmarks();
      });
    });
    $('.box').mousedown(function(event)
    {
      if (event.which == 1)
      {
        $("#url").val( $(this).attr("title") );
        changeUrl();
        fadeOut();
      }
    });
  });
}

var bookmarksPopupClosed = true;

$("#bookmarks").click(function()
{
  if (bookmarksPopupClosed)
    fadeIn();
  else
    fadeOut();
});

function fadeIn()
{
  $("#bookmarks-popup").fadeIn(100);
  bookmarksPopupClosed = false;
}

function fadeOut()
{
  $("#bookmarks-popup").fadeOut(100);
  bookmarksPopupClosed = true;
}

var expandContentWidth = $("#expand-content").outerWidth();
$("#expand-content").css({marginLeft: "-61px"});
var expandOpen = false;

function expand()
{
  if (!expandOpen)
  {
    chrome.storage.local.set({'expandOpen': 'true'});
    $("#expand-content").animate(
    {
      marginLeft: "0px"
    },
    200 );
  }
  else
  {
    chrome.storage.local.set({'expandOpen': 'false'});
    $("#expand-content").animate(
    {
      marginLeft: "-61px"
    },
    200 );
  }
  expandOpen = !expandOpen;
}

$("#expand").click(function()
{
  expand();
});

chrome.storage.local.get('expandOpen', function(object)
{
  if ( object.expandOpen == "true")
    expand();
});

/* ------------- */
/* Auto-refresh: */
/* ------------- */

var displayAutoReload = true;
var autoReload = false;

function openAutoReload()
{
  displayAutoReload = false;

  $("#auto-reload").css("left", event.pageX);
  $("#auto-reload").css("top", event.pageY);

  $("#auto-reload").css("display", "block");
}

function closeAutoReload()
{
  displayAutoReload = true;
  $("#auto-reload").css("display", "none");
}

$("#reload").bind("contextmenu", function (event)
{
  event.preventDefault();

  if (displayAutoReload)
    openAutoReload();
  else
    closeAutoReload();
});

// The user should also be able to close with left click:
$("#reload").click(function()
{
  if (!displayAutoReload)
    closeAutoReload();
});

// And by pressing "close":
$("#auto-reload .close").click(function()
{
  if (!displayAutoReload)
    closeAutoReload();
});

function setReload(time, item)
{
  removeReload();

  autoReload = setInterval(function()
  {
    changeUrl();
  },
  time * 1000);

  $(item).css("color", "lightblue");
  $("#reload").css("background-color", "lightblue");
  $("#auto-reload .clear").css("display", "block");
}

function removeReload()
{
  $("#auto-reload li").css("color", "black");
  $("#reload").css("background-color", "#F2F2F2");
  $("#auto-reload .clear").css("display", "none");

  if (autoReload != false)
    clearInterval(autoReload);

  closeAutoReload();
}

$("#auto-reload li").click(function()
{
  // The Value the user clicked on on the list:
  var item = this;
  var time = Number( $(this).attr("data-time") );

  // Security, if the user has modified the HTML:
  if (isNaN(time))
    return;

  if (time != 0)
  {
    setReload(time, item);
  }
  else
  {
    var lastCustomTime = "";
    chrome.storage.local.get('lastCustomTime', function(object)
    {
      if ( typeof object.lastCustomTime !== "undefined")
        lastCustomTime = object.lastCustomTime;

      time = "";
      var wrong = "";
      while (time != null && time.match(/^\d+:\d+:\d+$/) == null || time == "0:0:0")
      {
        time = prompt(wrong + "Please enter the interval in this format: Hours:Minutes:Seconds", lastCustomTime);
        wrong = "Wrong format specified.\n\n";
      }
      // If the user has pressed cancel on the prompt:
      if (time == null)
        return;

      chrome.storage.local.set({'lastCustomTime': time});
      var values = time.split(":");
      time = Number(values[0]) * 3600 + Number(values[1]) * 60 + Number(values[2]);
      setReload(time, item);
    });
  }
});

$("#auto-reload .clear").click(function()
{
  removeReload();
});

$("#auto-reload .clear").click(function()
{
  removeReload();
});

/* ------------- */
/* User-agent:   */
/* ------------- */

var userAgent;

chrome.storage.local.get('userAgent', function(object)
{
  if ( typeof object.userAgent === "undefined")
    updateUserAgent("desktop");
  else
    updateUserAgent(object.userAgent);
});

function updateUserAgent(agent)
{
  if (typeof agent !== "undefined")
  {
    chrome.storage.local.set({ 'userAgent': agent });
    chrome.runtime.sendMessage({ userAgent: agent });
    userAgent = agent;
  }

  if ( userAgent === "mobile")
    $("#expand").css("background-color", "green");
  else
    $("#expand").css("background-color", "initial");

}

$("#expand").bind("contextmenu", function (event)
{
  event.preventDefault();

  if (userAgent === "mobile")
    updateUserAgent("desktop");
  else
    updateUserAgent("mobile");
});