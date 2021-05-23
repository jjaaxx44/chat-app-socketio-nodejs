const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const constants = require('./constants')
const { generateMsg } = require('./utils/messages')
const Filter = require('bad-words')

const {
	removeUser,
	addUser,
	getUser,
	getUsersInRoom
} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicPath = path.join(__dirname, '../public/')

//setup static directory
app.use(express.static(publicPath))

app.get('', (req, res) => {
	res.render('index')
})

io.on('connection', (socket) => {
	socket.on('join', ({ username, room }, callback) => {
		const { error, user } = addUser({ id: socket.id, username, room })

		if (error) {
			return callback(error)
		}

		socket.join(user.room)
		socket.emit('msg', generateMsg('Admin', 'Welcome to chat app!!!'))
		socket.broadcast.to(user.room).emit('msg', generateMsg('Admin', `${user.username} has joined`))

		io.to(user.room).emit('roomData', {
			room: user.room,
			users: getUsersInRoom(user.room)
		})
		callback()
	})

	socket.on('sendMessage', (msg, callback) => {
		const filter = new Filter()
		const user = getUser(socket.id)
		if (filter.isProfane(msg)) {
			return callback('profanity is not allowed')
		}
		io.to(user.room).emit('msg', generateMsg(user.username, msg))
		callback('Delivered')
	})

	socket.on('sendLocation', ({ lat, long }, callback) => {
		const user = getUser(socket.id)
		io.to(user.room).emit('locMsg', generateMsg(user.username, `https://google.com/maps?q=${lat},${long}`))
		callback('location shared')
	})

	socket.on('disconnect', () => {
		const user = removeUser(socket.id)
		if (user) {
			io.to(user.room).emit('msg', generateMsg('Admin', `${user.username} has left`))
			io.to(user.room).emit('roomData', {
				room: user.room,
				users: getUsersInRoom(user.room)
			})
		}
	})
})

server.listen(port, () => {
	// eslint-disable-next-line no-console
	console.log(constants.statusChalk('Server is up on port ' + port))
})