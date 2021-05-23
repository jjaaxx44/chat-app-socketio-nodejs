/* eslint-disable no-undef */
const socket = io()

// elements
const $chatForm = document.querySelector('#msg-form')
const $msgInput = $chatForm.querySelector('input')
const $sendMsgButton = $chatForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar')

// templets
const msgTemplet = document.querySelector('#msg-templet').innerHTML
const locTemplet = document.querySelector('#location-templet').innerHTML
const sideBarTemplet = document.querySelector('#sidebar-templet').innerHTML

//options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
	const $newMsg = $messages.lastElementChild
	const newMsgStyle = getComputedStyle($newMsg)
	const newMsgMargin = parseInt(newMsgStyle.marginBottom)
	const newMsgHeight = $newMsg.offsetHeight + newMsgMargin

	const visibleHeight = $messages.offsetHeight
	const containerHeight = $messages.scrollHeight

	const scrollOffset = $messages.scrollTop + visibleHeight

	if (containerHeight - newMsgHeight <= scrollOffset) {
		$messages.scrollTop = $messages.scrollHeight
	}
}

socket.on('msg', (msg) => {
	const html = Mustache.render(msgTemplet, {
		username: msg.username,
		message: msg.text,
		createdAt: moment(msg.createdAt).format('hh:mm:ss a')
	})
	$messages.insertAdjacentHTML('beforeend', html)
	autoScroll()
})

socket.on('locMsg', (msg) => {
	const html = Mustache.render(locTemplet, {
		username: msg.username,
		location: msg.text,
		createdAt: moment(msg.createdAt).format('hh:mm:ss a')
	})
	$messages.insertAdjacentHTML('beforeend', html)
	autoScroll()
})

socket.on('roomData', ({ room, users }) => {
	const html = Mustache.render(sideBarTemplet, {
		room,
		users
	})
	$sidebar.innerHTML = html
})

$chatForm.addEventListener('submit', (event) => {
	event.preventDefault()

	$sendMsgButton.setAttribute('disabled', 'disabled')

	const chatMsg = $msgInput.value
	socket.emit('sendMessage', chatMsg, (callbackResponce) => {
		$sendMsgButton.removeAttribute('disabled')
		$msgInput.value = ''
		$msgInput.focus()
		if (callbackResponce) {
			// eslint-disable-next-line no-console
			return console.log(callbackResponce)
		}
	})
})

$locationButton.addEventListener('click', (event) => {
	if (!navigator.geolocation) {
		return alert('geo location is not supported by your broser')
	}
	event.preventDefault()
	$locationButton.setAttribute('disabled', 'disabled')

	navigator.geolocation.getCurrentPosition((position) => {
		socket.emit('sendLocation', {
			lat: position.coords.latitude,
			long: position.coords.longitude
		}, (callbackResponce) => {
			$locationButton.removeAttribute('disabled')
			// eslint-disable-next-line no-console
			console.log(callbackResponce)
		})
	})
})

socket.emit('join', { username, room }, (error) => {
	if (error) {
		alert(error)
		location.href = './'
	}
})