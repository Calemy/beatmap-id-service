import mysql from "mysql-commands"
import { username, password, database, host } from "../config.js"

export default mysql.createConnection({
    host,
    user: username,
    password,
    database
}) 