const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async (request, response) => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        app.listen(3000, () => {
            console.log("Server Running at http://localhost:3000/");
        });

    } catch(e) {
        console.log(`DB Error: ${e.message}`);
        process.exit(1);
    }
};

initializeDBAndServer();

module.exports = app;

const hasPriorityAndStatusProperties = (requestQuery) => {
    return (
        requestQuery.priority !== undefined && requestQuery.status !== undefined
    );
};

const hasPriorityProperty = (requestQuery) => {
    return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
    return requestQuery.status !== undefined;
};

// API 1 - GET Scenario 1 - Returns a list of all todos whose status is 'TO DO'
app.get("/todos/", async (request, response) => {
    let getTodosQuery = "";
    const { search_q = "", priority, status } = request.query;

    switch (true) {
        case hasPriorityAndStatusProperties(request.query): 
            getTodosQuery = `
                SELECT
                    *
                FROM
                    todo 
                WHERE
                    todo LIKE '%${search_q}%'
                    AND status = '${status}'
                    AND priority = '${priority}';`;
            break;
        case hasPriorityProperty(request.query):
            getTodosQuery = `
                SELECT
                    *
                FROM
                    todo 
                WHERE
                    todo LIKE '%${search_q}%'
                    AND priority = '${priority}';`;
            break;
        case hasStatusProperty(request.query):
            getTodosQuery = `
                SELECT
                    *
                FROM
                    todo 
                WHERE
                    todo LIKE '%${search_q}%'
                    AND status = '${status}';`;
            break;
        default:
            getTodosQuery = `
                SELECT
                    *
                FROM
                    todo 
                WHERE
                    todo LIKE '%${search_q}%';`;
    };

    const data = await db.all(getTodosQuery);
    response.send(data);
});

// API 2 - GET Returns a specific todo based on the todo ID
app.get("/todos/:todoId/", async (request, response) => {
    const { todoId } = request.params;

    const getATodoQuery = `
        SELECT 
            *
        FROM 
            todo
        WHERE 
            id = ${todoId};`;
    
    const getATodo = await db.get(getATodoQuery);
    response.send(getATodo);
});

// API 3 - POST Create a todo in the todo table
app.post("/todos/", async (request, response) => {
    const todoDetails = request.body;

    const { id, todo, priority, status } = todoDetails;

    const createTodoQuery = `
        INSERT INTO 
            todo (id, todo, priority, status )
        VALUES (
             ${id},
            '${todo}',
            '${priority}',
            '${status}'
        );`;

    await db.run(createTodoQuery);
    response.send("Todo Successfully Added");
});

// API 4 - PUT Updates the details of a specific todo based on the todo ID
app.put("/todos/:todoId/", async (request, response) => {
    const { todoId } = request.params;
    let updatingColumn = "";
    const todoDetails = request.body;

    switch (true) {
        case todoDetails.todo !== undefined:
            updatingColumn = "Todo";
            break;
        case todoDetails.priority !== undefined:
            updatingColumn = "Priority";
            break;
        case todoDetails.status !== undefined:
            updatingColumn = "Status";
            break;
    };

    const previousTodoQuery = `
        SELECT
            *
        FROM 
            todo
        WHERE 
            id = ${todoId};`;
    
    const previousTodo = await db.get(previousTodoQuery);

    const {
        todo = previousTodo.todo, 
        priority = previousTodo.priority, 
        status = previousTodo.status
    } = request.body;

    const updateTodoQuery = `
        UPDATE 
            todo 
        SET
            todo = '${todo}',
            priority = '${priority}',
            status = '${status}'
        WHERE 
            id = ${todoId};`;

    await db.run(updateTodoQuery);
    response.send(`${updatingColumn} Updated`);
});

// API - 5 DELETE Deletes a todo from the todo table based on the todo ID
app.delete("/todos/:todoId/", async (request, response) => {
    const { todoId } = request.params;

    const deleteTodoQuery = `
        DELETE FROM 
            todo 
        WHERE
            id = ${todoId};`;
    
    await db.run(deleteTodoQuery);
    response.send("Todo Deleted");
});