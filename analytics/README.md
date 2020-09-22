# Project 2

Web Programming with Python and JavaScript

FLACK FEATURES
* New user registration 
* Add channel
* Post message in channel
* Delete you own messages <== this is my special personal feature
* Automatically roll off the oldest message in the channel when it contains more than 100 messages

TEST PROCEDURE
0. Type . venv/bin/activate in the project2 directory
1. Type flask run 
2. Go to http://127.0.0.1:5000
3. Enter a user name #1 on the registration page 
4. Type ChannelName #1 and press submit
5. Enter some messages and submit
6. Add channel Name #2
7. Enter some messages in Channel#2
8. Toggle between channels and verify that the correct messages remain
9. Hover over a message and press the Delete button
10. Open another tab and go to http://127.0.0.1:5000
11. Toggle between channels and ensure that all expected messages are there
10. Go to http://127.0.0.1:5000/register
11. Re-register user name #1 again (duplicate)
12. Verify that the error page displays
13. Select the registration link
14. Register user name #2 and you will be redirected back to the chat
15. Verify that the expected messages from User #1 are displayed
16. Verify that the delete message buttons are disabled for User #1 messages
17. Enter messages in channels 1 and 2
18. Verify that User #2 can delete their own messages
19. Type 101 messages (there is a constant CONST_MAX_MESSAGES that can be set lower for testing purposes)
20. Go to http://127.0.0.1:5000 and verify that only 100 messages are there

FILE MANIFEST
* index.html     The main chat page
* index.js       Controls the user interaction
* register.html  For new user name registration
* error.html     For duplicate user names and channel names
* application.py Contains all the routes and the data structures
* post.py        Class with the post data structure and __str__() and toDict() methods
* styles.css     Controls layout with CSS grid and highlighting and styling with classes
