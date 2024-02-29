const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');


const app = express();
const PORT = process.env.PORT || 3000;
const PEXELS_API_KEY = '7h3uQpJDJylMu3cv5lwHCZA5WqPLlfEmBTEVqcBjfx6hVH3POAGwgSFU';
const TIMEZONEDB_API_KEY = 'ZE0QVPH5UXWU';
const GEONAMES_API_KEY = 'malik01';

// Инициализация экземпляра Google Cloud Translation API


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Обработка запросов на перевод текста
app.post('/translate', async (req, res) => {
    const { text, targetLanguage } = req.body;
    try {
        // Выполнение перевода текста
        const [translation] = await translate.translate(text, targetLanguage);
        res.json({ translatedText: translation }); // Отправка переведенного текста обратно клиенту
    } catch (error) {
        console.error('Error translating text:', error);
        res.status(500).json({ error: 'Error translating text' });
    }
});
dotenv.config();

//middleware
app.use('/pics', express.static(path.join(__dirname, 'pics')));

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false
}));
//подключаю к монгодб
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

const AttractionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    images: { type: [String], required: true }, // Пути к изображениям
}, { timestamps: true }); // Добавление автоматического поля времени изменений




// Страница администратора для управления достопримечательностями
app.get('/admin/attractions', requireAdmin, async (req, res) => {
    try {
        const attractions = await Attraction.find({});
        res.render('attractions_admin', { attractions });
    } catch (error) {
        console.error('Error rendering attractions admin page:', error);
        res.status(500).send('Error rendering attractions admin page');
    }
});

// Обработка запроса на добавление новой достопримечательности
app.post('/admin/attractions', requireAdmin, async (req, res) => {
    try {
        const { name, description, image1, image2, image3 } = req.body;
        const newAttraction = new Attraction({
            name,
            description,
            images: [image1, image2, image3], // Массив с тремя изображениями
        });
        await newAttraction.save();
        res.redirect('/admin/attractions');
    } catch (error) {
        console.error('Error adding new attraction:', error);
        res.status(500).send('Server Error');
    }
});

// Обработка запроса на редактирование достопримечательности по ID
app.post('/admin/attractions/edit/:attractionId', requireAdmin, async (req, res) => {
    const attractionId = req.params.attractionId;
    const { name, description } = req.body;
    try {
        const attraction = await Attraction.findByIdAndUpdate(attractionId, { name, description });
        if (!attraction) {
            return res.status(404).send('Attraction not found');
        }
        res.status(200).send('Attraction updated successfully');
    } catch (error) {
        console.error('Error updating attraction:', error);
        res.status(500).send('Server Error');
    }
});


// Обработка запроса на удаление достопримечательности по ID
app.post('/admin/attractions/delete/:attractionId', requireAdmin, async (req, res) => {
    const attractionId = req.params.attractionId;
    try {
        await Attraction.findByIdAndDelete(attractionId);
        res.redirect('/admin/attractions');
    } catch (error) {
        console.error('Error deleting attraction:', error);
        res.status(500).send('Server Error');
    }
});

// Определение маршрута, обрабатывающего запрос на страницу attractions
app.get('/attractions', async (req, res) => {
    try {
        const attractions = await Attraction.find({}); // Получение списка достопримечательностей из базы данных
        res.render('attractions', { attractions }); // Передача списка достопримечательностей в шаблон EJS
    } catch (error) {
        console.error('Error rendering attractions page:', error);
        res.status(500).send('Error rendering attractions page');
    }
});

// Определение маршрута для страницы администратора достопримечательностей
app.get('/attractions_admin', requireAdmin, async (req, res) => {
    try {
        const attractions = await Attraction.find({});
        res.render('attractions_admin', { attractions });
    } catch (error) {
        console.error('Error rendering attractions admin page:', error);
        res.status(500).send('Error rendering attractions admin page');
    }
});



const Attraction = mongoose.model('Attraction', AttractionSchema);


//схема для юзеров
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
}, { timestamps: true });

UserSchema.index({ username: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

const User = mongoose.model('User', UserSchema);
//главная страница
app.get('/', (req, res) => {
    res.render('main')
});
app.get('/logreg', (req, res) => {
    res.render('logreg');
});
//страница регистрации
app.get('/register', (req, res) => {
    res.render('register', { message: '.' });
});

//обработка запроса чтобы зарегаться
// Обработка запроса чтобы зарегистрироваться
// Обработка запроса чтобы зарегистрироваться
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.render('register', { message: 'Username already exists' }); // Вывод сообщения о существующем имени пользователя
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.render('login', { message: 'Registration successful. You can now log in.' });
    } catch (error) {
        console.error('Error saving user to MongoDB:', error);
        res.status(500).send('Server Error');
    }
});

//страница логина
app.get('/login', (req, res) => {
    res.render('login');
});
app.get('/attractions', (req, res) => {
    res.render('attractions');
});
// Обработка запроса на логаут
app.get('/logout', (req, res) => {
    // Очистка данных сеанса
    req.session.destroy((err) => {
        if (err) {
            console.error('Error logging out:', err);
            return res.status(500).send('Server Error');
        }
        // Перенаправление на страницу logreg после выхода
        res.redirect('/logreg');
    });
});

//обработка запроса чтобы залогиниться
app.post('/login', async (req, res) => {
    const {username, password} = req.body;
    try {
        const user = await User.findOne({username});
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).send('Invalid username or password');
        }
        if (user.isAdmin) {
            req.session.userId = user._id;
            req.session.isAdmin = user.isAdmin;
            return res.redirect('/admin');
        } else {
            req.session.userId = user._id;
            return res.redirect('/city');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});
// Предположим, что у вас есть объект пользователя из базы данных MongoDB
// Обработчик маршрута для страницы attractions

//middleware для проверки юзеров
function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).send('Unauthorized');
    }
    next();
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
//middleware для проверки админа
async function requireAdmin(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    try {
        const user = await User.findById(req.session.userId);
        if (!user || !user.isAdmin) {
            return res.redirect('/login');
        }
        next();
    } catch (error) {
        console.error('Error checking admin status:', error);
        res.status(500).send('Server Error');
    }
}
//обработка запросов где админ изменяет юзеров
app.post('/admin/editUser', requireAdmin, async (req, res) => {
    const {userId, isAdmin, username, password} = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }
        if (isAdmin !== undefined) {
            user.isAdmin = isAdmin;
        }
        if (username) {
            user.username = username;
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }
        await user.save();
        res.status(200).send('User updated successfully');
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send('Server Error');
    }
});

//обработка запроса чтобы удалить юзера через айди
app.post('/admin/deleteUser/:userId', requireAdmin, async (req, res) => {
    const userId = req.params.userId;
    try {
        await User.findByIdAndDelete(userId);
        res.redirect('/admin');
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send('Server Error');
    }
});
//обработка запроса чтобы удалить юзера
app.post('/admin/deleteUser', requireAdmin, async (req, res) => {
    const {username} = req.body;
    try {
        await User.findOneAndDelete({username});
        res.redirect('/admin');
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send('Server Error');
    }
});
//обработка запроса чтобы дать админку юзеру
app.post('/admin/grantAdmin', requireAdmin, async (req, res) => {
    const {username, isAdmin} = req.body;
    try {
        const user = await User.findOne({username});
        if (!user) {
            return res.status(404).send('User not found');
        }
        user.isAdmin = isAdmin || false;
        await user.save();
        res.status(200).send('Admin access granted successfully');
    } catch (error) {
        console.error('Error granting admin access:', error);
        res.status(500).send('Server Error');
    }
});
//страница админа
app.get('/admin', requireAdmin, async (req, res) => {
    try {
        const users = await User.find({});
        res.render('admin', {users});
    } catch (error) {
        console.error('Error rendering admin page:', error);
        res.status(500).send('Error rendering admin page');
    }
});

//схема погоды
const WeatherSchema = new mongoose.Schema({
    city: String,
    temperature: Number,
    description: String,
});

const Weather = mongoose.model('Weather', WeatherSchema);
//схема для времени
const TimeSchema = new mongoose.Schema({
    city: String,
    time: String,
});

const Time = mongoose.model('Time', TimeSchema);
//схема для фото
const PhotoSchema = new mongoose.Schema({
    cityName: {type: String, required: true},
    photos: [{type: String, required: true}]
});

const Photo = mongoose.model('Photo', PhotoSchema);


//страница времени
app.get('/get-time',requireAuth, (req, res) => {
    res.render('get-time', {time: null, city: null});
});
//обработка запроса чтобы время получить
app.post('/get-time', async (req, res) => {
    try {
        const {city} = req.body;
        const response = await axios.get(`http://api.timezonedb.com/v2.1/get-time-zone?key=${TIMEZONEDB_API_KEY}&format=json&by=zone&zone=${city}`);
        const time = response.data.formatted;
        await saveHistory(req.session.userId, '/get-time', req.body, { time });
        const newTime = new Time({city, time});
        await newTime.save();

        res.render('get-time', {time, city});
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});
//страница погоды
app.get('/weather', requireAuth, async (req, res) => {
    try {
        res.render('weather.ejs', {weatherData: null});
    } catch (error) {
        console.error('Error rendering weather page:', error);
        res.status(500).send('Error rendering weather page');
    }
});
//обработка запроса чтобы данные получить о погоде
app.post('/weather', requireAuth, async (req, res) => {
    try {
        const city = req.body.city;
        const apiKey = process.env.OPENWEATHERMAP_API_KEY;
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;
        const weatherResponse = await axios.get(weatherUrl);

        if (weatherResponse.status === 200) {
            const weatherData = {
                city: weatherResponse.data.name,
                temperature: weatherResponse.data.main.temp,
                description: weatherResponse.data.weather[0].description
            };
            await saveHistory(req.session.userId, '/weather', { city }, weatherData);

            const newWeather = new Weather(weatherData);
            await newWeather.save();

            res.json(weatherData);
        } else {
            console.error('Error fetching weather data:', weatherResponse.statusText);
            res.status(weatherResponse.status).send('Error fetching weather data');
        }
    } catch (error) {
        console.error('Error fetching weather data:', error);
        res.status(500).send('Error fetching weather data');
    }
});


//страница с фотками
app.get('/city',requireAuth,(req, res) => {
    res.render('city', { cityName: '', photos: [] });
});

//обработка запроса с фотографиями
app.post('/city', async (req, res) => {
    const cityName = req.body.cityName;
    try {
        const response = await axios.get(`https://api.pexels.com/v1/search`, {
            headers: {
                Authorization: PEXELS_API_KEY
            },
            params: {
                query: cityName,
                per_page: 1
            }
        });

        const photoUrls = response.data.photos.map(photo => photo.src.original);
        const photoData = new Photo({cityName, photos: photoUrls});
        await photoData.save();
        await saveHistory(req.session.userId, '/city', req.body, { photos: photoUrls });

        res.render('city', {cityName, photos: photoUrls});
    } catch (error) {
        console.error('Error fetching photos:', error);
        res.status(500).send('Error fetching photos');
    }
});

//страница информация о городе
app.get('/city-info', requireAuth, (req, res) => {
    res.render('city-info',
        {cityInfo: null});
});
//схема для информации о городе


app.get('/', function(req, res) {
    if (req.session && req.session.isAdmin)  {
        res.redirect('/admin'); // Перенаправление администраторов на страницу администратора
    } else {
        res.sendFile(__dirname + '/city'); // Остальным пользователям отправляем домашнюю страницу
    }
});

app.get('/admin', requireAdmin, function(req, res) {
    res.sendFile(__dirname + '/admin'); // Отправляем страницу администратора только аутентифицированным администраторам
});

// Обработка запроса для получения данных о городе
app.post('/city-info', async (req, res) => {
    try {
        const { city } = req.body;
        const response = await axios.get(`http://api.geonames.org/searchJSON`, {
            params: {
                q: city,
                username: 'malik01'
            }
        });

        if (response.status === 200 && response.data.geonames && response.data.geonames.length > 0) {
            const cityData = {
                name: response.data.geonames[0].name,
                country: response.data.geonames[0].countryName,
                population: response.data.geonames[0].population
            };

            res.json({ cityInfo: cityData }); // Отправляем данные в формате JSON
        } else {
            res.json({ cityInfo: null }); // Отправляем null в случае отсутствия данных о городе
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' }); // Отправляем ошибку в формате JSON
    }
});


// Обработка запроса на очистку истории
// Обработка запроса на очистку истории
app.post('/clear-history', requireAuth, async (req, res) => {
    try {
        await History.deleteMany({ userId: req.session.userId });
        res.sendStatus(200); // Отправляем успешный статус ответа
    } catch (error) {
        console.error('Error clearing history:', error);
        res.status(500).send('Server Error');
    }
});








// Маршрут для отображения истории запросов и результатов
app.get('/history', requireAuth, async (req, res) => {
    try {
        // Получаем историю запросов из базы данных
        const history = await History.find({ userId: req.session.userId }).sort({ timestamp: -1 });
        res.render('history', { history });
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).send('Server Error');
    }
});


const CityInfoSchema = new mongoose.Schema({
    name: { type: String, required: true },
    country: { type: String, required: true },
    population: { type: Number, required: true }
});
const CityInfo = mongoose.model('CityInfo', CityInfoSchema);
// Определение схемы истории запросов
const HistorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    endpoint: { type: String, required: true },
    requestPayload: { type: Object, required: true },
    response: { type: Object, required: true },
    cityPopulation: { type: Number }, // Добавлено поле для хранения населения города
    timestamp: { type: Date, default: Date.now }
});
// Создание модели истории запросов
const History = mongoose.model('History', HistorySchema);
async function saveHistory(userId, endpoint, requestPayload, response) {
    try {
        const history = new History({
            userId,
            endpoint,
            requestPayload,
            response
        });
        await history.save();
    } catch (error) {
        console.error('Error saving history:', error);
        // Здесь можно обработать ошибку сохранения истории
    }
}
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});