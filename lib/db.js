import mysql from 'mysql'
import { db } from './config'

const connection = mysql.createConnection(db);

export default connection;
