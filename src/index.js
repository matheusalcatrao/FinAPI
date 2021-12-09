const { json, request, response } = require("express");
const express = require("express");
const { v4: uuidV4 } = require("uuid");

const app = express();
app.use(express.json());

const customers = [];

//Middleware
function verifyIfExistsAccountCPF(request, response, next) {
    const {cpf} = request.headers;

    const customer = customers.find((customer) => customer.cpf === cpf)
    
    if (!customer) {
        return response.status(400).json({error: "Not found customer"})
    }

    request.customer = customer

    return next();
}

function getBalance(statement) {
    statement.reduce((acc, operation) => {
        if (operation.type === 'credit') {
            return acc + operation.amount;
        }
        return acc - operation.amount
    })
}

app.post('/account', (request, response) => {
    const {cpf, name, statement} = request.body;

    const customersAlreadyExists = customers.some((customers) => customers.cpf === cpf)

    if (customersAlreadyExists) {
        return response.status(400).json({error: "Customer already exists!"})
    }

    const id = uuidV4();

    customers.push({
        cpf, name, id, statement: []
    })

    return response.status(201).send();
});

// app.use(verifyIfExistsAccountCPF);

app.get('/statement', verifyIfExistsAccountCPF, (request, response) => {
    const {customer} = request;
    return response.status(200).json(customer.statement)
})

app.post('/deposit', verifyIfExistsAccountCPF, (request, response) => {
    const {description, amount} = request.body;

    const { customer } = request;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: 'credit'
    }

    customer.statement.push(statementOperation)

    return response.status(201).send();
})

app.post('/withdraw', verifyIfExistsAccountCPF, (request, response) => {
    const { amount } = request.body;
    const { customer } = request;

    const balance = getBalance(customer.statement);

    if (balance < amount) {
        return response.status(400).json({error: 'Insufficient funds!'})
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: 'debit'
    }
    customer.statement.push(statementOperation)

    return response.status(201).send();
})

app.get('/statement/date', verifyIfExistsAccountCPF, (request, response) => {
    const {customer} = request;
    const { date } = request.query;

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString())

    return response.json(statement)
})


app.listen(3939);