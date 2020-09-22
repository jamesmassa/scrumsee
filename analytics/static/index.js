document.addEventListener('DOMContentLoaded', () => {

    let displayname=localStorage.getItem("displayname") 
    if (displayname) {displayname = displayname.trim()};
    if (displayname == "None") {
      localStorage.removeItem("displayname");
      displayname=false;
    }

    let elem=document.querySelector('#displayname');
    if (elem && elem.innerHTML.trim()=="None"){
      elem.innerHTML="";
    }

    if (displayname && displayname.length > 0) {
      //User was previously registered and their displayname was saved in local storage durin a previous session
        elem.innerHTML=displayname; 
    } else if (elem && elem.innerHTML.trim().length > 0) {
      //User just came from the registration page
        displayname = elem.innerHTML.trim();
        localStorage.setItem("displayname", displayname);
    } else {
        //User not registered so redirect to the registration page
        window.location.replace(window.location.origin + "/register");
    }

    const channels = document.querySelectorAll('.channel');
    if (channels.length == 0) {
        localStorage.removeItem("selectedChannel");
        document.querySelector('#posttext').disabled=true
    } else {
      document.querySelector('#posttext').disabled=false
    }

    const selectedChannel = localStorage.getItem("selectedChannel");

    //When a channel is selected, save the channel name in local storage so it can be highlighted 
    //after redirect to the URL that displays messages for that channel.
    let highlighted = false;
    
    channels.forEach((channel) => {
        if (channel.innerHTML == selectedChannel) {
          highlighted = true; 
          channel.className = "channel selected-channel";
        }
        channel.addEventListener('click', () => {
            localStorage.setItem("selectedChannel", channel.innerHTML);
            window.location.replace(window.location.origin + "/index/" + channel.innerHTML);
        });
    });
    
    if (channels.length > 0 && highlighted == false) {
        document.querySelector("#channellist").firstElementChild.className = "channel selected-channel";
    }

    // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    //Configure buttons and lists
    socket.on('connect', () => {

        let buttons = document.querySelectorAll('.post > .delete-button');
        buttons.forEach((button) => {
            button.addEventListener('click', () => {
                let postid=button.innerHTML.match(/\d+/);
                socket.emit('delete post', {'postid': postid});
            });
        });
        disableDeleteButtons();

        document.querySelector('#addpost').disabled = true;

        document.querySelector('#posttext').onkeyup = () => {
        if (document.querySelector('#posttext').value.length > 0)
                document.querySelector('#addpost').disabled = false;
        else
                document.querySelector('#addpost').disabled = true;
        };

        document.querySelector('#postform').onsubmit = () => {
            const posttext = document.querySelector('#posttext').value;
            const channelname=document.querySelector('.selected-channel').innerHTML;
            document.querySelector('#posttext').value = '';
            document.querySelector('#addpost').disabled = true;
            socket.emit('add post', 
                {'posttext': posttext, 'displayname': displayname, 'channelname': channelname});
            return false;
        };
        sortList(document.querySelector("#postlist"))

        document.querySelector('#addchannel').disabled = true;

        document.querySelector('#channelname').onkeyup = () => {
        if (document.querySelector('#channelname').value.length > 0)
                document.querySelector('#addchannel').disabled = false;
        else
                document.querySelector('#addchannel').disabled = true;
        };

        document.querySelector('#channelsform').onsubmit = () => {
            const channelname = document.querySelector('#channelname').value;
            document.querySelector('#channelname').value = '';
            document.querySelector('#addchannel').disabled = true;
            localStorage.setItem("selectedChannel", channelname);
            socket.emit('add channel', {'channelname': channelname});
            return false;
        };
        sortList(document.querySelector("#channellist"))
    });

    // When a new post is added, add it to the chat history
    socket.on('new post', newpost => {
        const li = document.createElement('li');
        li.className = "post";
        const timestamp = "<span class='timestamp'>" + newpost.timestamp + "</span>";
        const displayname = "<span class='displayname'>" + newpost.displayname + "</span>";
        const posttext = "<div class='posttext'>" + newpost.posttext + "</div>";
        const id = "<span class='postid'>" + newpost.id + "</span>";
        const deletebutton = "<button class='delete-button'>Delete Post " + newpost.id + "</button>";
        li.innerHTML = id+displayname+" "+timestamp+posttext+deletebutton;
        list = document.querySelector("#postlist");
        list.append(li);
        sortList(list);

        button = li.lastChild;
        button.addEventListener('click', () => {
            let postid=button.innerHTML.match(/\d+/);
            socket.emit('delete post', {'postid': postid});
        });
        disableDeleteButtons();

    });

    socket.on('client delete post', deletepost => {
        let postids = document.querySelectorAll(".postid");
        postids.forEach((postid) => {
            if (postid.innerHTML.trim()===deletepost) {
                postid.parentNode.remove();
            };
        });
    });

    // When a new channel is added, add it to the channel list
    socket.on('client add channel', newchannel => {
        const channels = document.querySelectorAll('.channel');
        channels.forEach((channel) => {
          channel.className = "channel";
        });
        const li = document.createElement('li');
        li.className = "channel selected-channel";
        li.innerHTML = newchannel;
        list = document.querySelector("#channellist");
        list.append(li);
        li.addEventListener('click', () => {
            localStorage.setItem("selectedChannel", li.innerHTML);
            window.location.replace(window.location.origin + "/index/" + li.innerHTML);
        });
        sortList(list);
    });

    socket.on('redirect', url => {
        window.location.href = url;
    });
});

//Only allow deleting of your own messages
//Disable delete buttons for posts that do not belong to the logged in user
function disableDeleteButtons() {
     const userdisplayname=localStorage.getItem("displayname");
     const buttons = document.querySelectorAll('.post > .delete-button');
     buttons.forEach((button) => {
         const postDisplayname=button.parentNode.childNodes[3].innerText;
         const postDisplayname2=button.parentNode.childNodes[1].innerText;
         if (postDisplayname == userdisplayname || postDisplayname2 == userdisplayname) {
             button.disabled=false;
         } else {
             button.disabled=true;
         };
     });
}

//FOOTNOTE CITATION
//Function sortlist adapted from https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_sort_list
//FOONOTE CITATION
function sortList(list) {
  var list, i, switching, b, shouldSwitch;
  switching = true;
  /* Make a loop that will continue until
  no switching has been done: */
  while (switching) {
    // start by saying: no switching is done:
    switching = false;
    b = list.getElementsByTagName("LI");
    // Loop through all list-items:
    for (i = 0; i < (b.length - 1); i++) {
      // start by saying there should be no switching:
      shouldSwitch = false;
      /* check if the next item should
      switch place with the current item: */
      if (b[i].innerHTML.toLowerCase() > b[i + 1].innerHTML.toLowerCase()) {
        /* if next item is alphabetically
        lower than current item, mark as a switch
        and break the loop: */
        shouldSwitch = true;
        break;
      }
    }
    if (shouldSwitch) {
      /* If a switch has been marked, make the switch
      and mark the switch as done: */
      b[i].parentNode.insertBefore(b[i + 1], b[i]);
      switching = true;
    }
  }
}
