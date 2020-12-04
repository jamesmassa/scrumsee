//Code in this file is adapted from David J. Cole's article: https://medium.com/javascript-in-plain-english/creating-a-dynamic-html-table-through-javascript-f554fba376cf
const scoreDiv = document.querySelector("div.sstable"); // Find the scoreboard div in our html
const tableHeaders = ["Key", "Description", "Priority", "Estimate", "Assignee", "Epic"];
const createSsTable = () => {
    while (scoreDiv.firstChild) scoreDiv.removeChild(scoreDiv.firstChild); // Remove all children from scoreboard div (if any)
    const ssTable = document.createElement('table'); // Create the table itself
    ssTable.className = 'ssTable table';
    const ssTableHead = document.createElement('thead'); // Creates the table header group element
    ssTableHead.className = 'ssTableHead';
    const ssTableHeaderRow = document.createElement('tr'); // Creates the row that will contain the headers
    ssTableHeaderRow.className = 'ssTableHeaderRow';
// Will iterate over all the strings in the tableHeader array and will append the header cells to the table header row
    tableHeaders.forEach(header => {
        const scoreHeader = document.createElement('th'); // Creates the current header cell during a specific iteration
        scoreHeader.innerText = header;
        ssTableHeaderRow.append(scoreHeader); // Appends the current header cell to the header row
    });
    ssTableHead.append(ssTableHeaderRow); // Appends the header row to the table header group element
    ssTable.append(ssTableHead);
    const ssTableBody = document.createElement('tbody'); // Creates the table body group element
    ssTableBody.className = "ssTable-Body";
    ssTable.append(ssTableBody); // Appends the table body group element to the table
    scoreDiv.append(ssTable); // Appends the table to the scoreboard div
}
// The function below will accept a single story and its index to create the global ranking
const appendStories = (singleStory, singleStoryIndex) => {
    const ssTable = document.querySelector('.ssTable'); // Find the table we created
    const ssTableBodyRow = document.createElement('tr'); // Create the current table row
    ssTableBodyRow.className = 'ssTableBodyRow';
// Lines 72-85 create the 5 column cells that will be appended to the current table row
    const scoreRanking = document.createElement('td');
    scoreRanking.innerText = singleStoryIndex;
    const usernameData = document.createElement('td');
    usernameData.innerText = singleStory.user.username;
    const scoreData = document.createElement('td');
    scoreData.innerText = singleStory.score;
    const timeData = document.createElement('td');
    timeData.innerText = singleStory.time_alive;
    const accuracyData = document.createElement('td');
    accuracyData.innerText = singleStory.accuracy;
    ssTableBodyRow.append(scoreRanking, usernameData, scoreData, timeData, accuracyData); // Append all 5 cells to the table row
    ssTable.append(ssTableBodyRow); // Append the current row to the scoreboard table body
};

