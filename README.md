# Quike
A Quick view of your current wrike projects, and timelogs.

## Creating Tasks
Creating new tasks with Quike is simple: simply click the "New task" button at the bottom of the popup. By default, the currently active document's title will be used for the task title. If you have specific web pages (such as error pages) that you frequently create tasks from, you can add meta tags for specific task data.

### Adding task meta data to your webpage
Add meta tags with the prefix "wrike_" to send this data to the task. For example: to se the task title add
```<meta name='wrike_title' content='My Task title'>```
You can add any of the values that the task may have by prefixing the attribute name with "wrike_" see https://developers.wrike.com/documentation/api/methods/create-task for a full list of available parameters.
