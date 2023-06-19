const { Scenes, session, Telegraf, Markup} = require('telegraf');
module.exports = {Markup}
require('dotenv').config()
const {otsen, startpx, pokaz, pokazns} = require('./additions/markups');
const { collection, ObjectId } = require('./additions/db');
const bot = new Telegraf(process.env.BOT_TOKEN);
const { enter, leave } = Scenes.Stage;


const get_author = new Scenes.BaseScene("get_author");

get_author.enter(async ctx => {
    try {
        await ctx.reply('🎛️ Введите ваш битмейкерский ник:')
    } catch (e) {
        console.error(e);
    }
})

get_author.on('text', async ctx => {
    try {
        const db = await collection.findOneAndUpdate({user_id: ctx.from.id}, {$set: {bitmar: ctx.message.text}})
        await ctx.tg.sendAudio(1031267639, db.value.audio_file, {caption: `<b>Битмарь:</b> <a href="https://${ctx.from.id}.com">${ctx.message.text}</a>`,reply_markup: {inline_keyboard: otsen}, parse_mode: 'HTML'})
        await ctx.reply('Отправил ✅')
        await ctx.scene.leave('get_author')
    } catch (e) {
        console.error(e);
    }
})

const stage = new Scenes.Stage([get_author]);  
bot.use(session());
bot.use(stage.middleware());  

bot.start(async ctx => {
    try {
        const db = await collection.findOne({user_id: ctx.from.id})
        if(!db) {
            await collection.insertOne({
                user_id: ctx.from.id,
                subscribed: false
            })
            await collection.findOneAndUpdate({_id: new ObjectId('64901b527a931a00216404d5')}, {$push: {users: ctx.from.id}})
        }
        if(ctx.from.id == 1031267639) return await ctx.reply('🎧 Здарова, Потата! Здесь ты можешь оценивать треки своих работяг во время стримов.\n\nДля того чтобы начать, разблокируй отправку треков, нажав на кнопку <b>"Активировать зацен 🎧"</b>', {parse_mode: "HTML", reply_markup: {keyboard: startpx, resize_keyboard: true}})
        await ctx.reply('🎧 Здарова, дорогой работяга! Здесь ты можешь скинуть свои треки на зацен во время стрима на канале <a href="https://www.youtube.com/channel/UCqfrkuibnQSwzMHADk0fJOw">PXTATXES</a>.\n\nДля того чтобы начать, отправь мне свой трек: ', {parse_mode: "HTML"})
    } catch (e) {
       console.error(e); 
    }
});

bot.help(async ctx => {
    try {
        await ctx.reply('Здесь ты можешь скинуть свои треки на зацен во время стрима на канале <a href="https://www.youtube.com/channel/UCqfrkuibnQSwzMHADk0fJOw">PXTATXES</a>.\n\nДля того чтобы начать, отправь мне свой трек: ', {parse_mode: "HTML"})
    } catch (e) {
       console.error(e); 
    }
});

bot.on('audio', async ctx => {
    try {
        // -1001974175255
        const isstrm = await collection.findOne({_id: new ObjectId('64901b527a931a00216404d5')})
        if(!isstrm.is_stream) return await ctx.reply('⚠️ Зацен треков неактивен, но как только он будет активен, я сообщу вам')
        const db = await collection.findOne({user_id: ctx.from.id})
        
        const inchanel = await ctx.tg.getChatMember(-1001559267480, ctx.from.id)
        if(inchanel.status == 'left') {
            return await ctx.reply('⚠️ Для того чтобы отправить свой трек на зацен, вам нужно быть подписанным на телеграм канал <a href="https://t.me/pxtatxes">"ПОТЭЙТОС"</a>', {disable_web_page_preview: true, parse_mode: 'HTML', reply_markup: {inline_keyboard: [[Markup.button.url('Открыть канал 📢', 'https://t.me/pxtatxes')]]}})
        }else {
            await collection.findOneAndUpdate({user_id: ctx.from.id}, {$set: {subscribed: true}})
        }

        if(isstrm.senders.includes(ctx.from.id)) return await ctx.reply('⚠️ Вы можете прислать только один трек')

        await collection.findOneAndUpdate({user_id: ctx.from.id}, {$set: {audio_file: ctx.message.audio.file_id}})
        await collection.findOneAndUpdate({_id: new ObjectId('64901b527a931a00216404d5')}, {$push: {senders: ctx.from.id}})
        await ctx.scene.enter('get_author')
    } catch (e) {
       console.error(e); 
    }
})


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

bot.hears(['Активировать зацен 🎧', '🎧 Активировать зацен 🎧'], async ctx => {
    try {
        if(ctx.from.id != 5103314362 && ctx.from.id != 1031267639) return
        const admdb = await collection.findOne({_id: new ObjectId('64901b527a931a00216404d5')})
        if(admdb.is_stream == true) return await ctx.reply('Активно 🎧')
        await ctx.reply('Уведомляю всех пользователей бота 📢\n\nПодождите...', {reply_markup: {remove_keyboard: true}})
        // admdb.users.length
        for (let i = 0; i < admdb.users.length; i++) {
            await ctx.tg.sendMessage(admdb.users[i], '🟢 Зацен ваших треков активна, пришлите мне ваш трек:', {disable_notification: false})
            await sleep(50)
        }
        await ctx.reply('Оценка треков активирована ✅\n\nТеперь вам смогут присылать треки. Вы можете смотреть каким трекам вы дали оценку, нажав на одну из кнопок на клавиатуре 🗃️\n\nТреки будут ниже ⬇️', {reply_markup: {keyboard: pokaz, resize_keyboard: true}})
        await collection.findOneAndUpdate({_id: new ObjectId('64901b527a931a00216404d5')}, {$set: {is_stream: true, prf: [], top: [], rs: [], senders: []}})
    } catch (e) {
        console.error(e);
    }
})

bot.hears(['🛑 Деактивировать зацен 🛑'], async ctx => {
    try {
        if(ctx.from.id != 5103314362 && ctx.from.id != 1031267639) return
        const admdb = await collection.findOne({_id: new ObjectId('64901b527a931a00216404d5')})
        if(admdb.is_stream == false) return
        await collection.findOneAndUpdate({_id: new ObjectId('64901b527a931a00216404d5')}, {$set: {is_stream: false}})
        await ctx.reply('Деактивировано ✅', {reply_markup: {keyboard: pokazns, resize_keyboard: true}})
    } catch (e) {
        console.error(e);
    }
})

bot.hears(['🗃️ Показать - КРУТО 🗃️', '🗃️ Показать - PRESS-F 🗃️', '💯 РАБОТЫ СТРИМА 💯'], async ctx => {
    try {
        if(ctx.from.id != 5103314362 && ctx.from.id != 1031267639) return
        const admdb = await collection.findOne({_id: new ObjectId('64901b527a931a00216404d5')})
        if(ctx.message.text == '🗃️ Показать - КРУТО 🗃️') {
            if(admdb.top.length == 0) return await ctx.reply('Пусто 🗿', {reply_markup: {keyboard: pokaz, resize_keyboard: true}})
            await ctx.reply(`🗃️ <b>Вот все треки с оценкой:</b> КРУТО`, {parse_mode: 'HTML'})
            for (let i = 0; i < admdb.top.length; i++) {
                await ctx.replyWithAudio(admdb.top[i].audio, {caption: `<b>Битмарь:</b> ${admdb.top[i].bitmar}`, parse_mode: 'HTML'})
                await sleep(50)
            }
        }else if(ctx.message.text == '🗃️ Показать - PRESS-F 🗃️') {
            if(admdb.prf.length == 0) return await ctx.reply('Пусто 🗿', {reply_markup: {keyboard: pokaz, resize_keyboard: true}})
            await ctx.reply(`🗃️ <b>Вот все треки с оценкой:</b> PRESS-F`, {parse_mode: 'HTML'})
            for (let i = 0; i < admdb.prf.length; i++) {
                await ctx.replyWithAudio(admdb.prf[i].audio, {caption: `<b>Битмарь:</b> ${admdb.prf[i].bitmar}`, parse_mode: 'HTML'})
                await sleep(50)
            }
        }else {
            if(admdb.rs.length == 0) return await ctx.reply('Пусто 🗿', {reply_markup: {keyboard: pokaz, resize_keyboard: true}})
            await ctx.reply(`🗃️ <b>Вот все треки с оценкой:</b> РАБОТА СТРИМА`, {parse_mode: 'HTML'})
            for (let i = 0; i < admdb.rs.length; i++) {
                await ctx.replyWithAudio(admdb.rs[i].audio, {caption: `<b>Битмарь:</b> ${admdb.rs[i].bitmar}`, parse_mode: 'HTML'})
                await sleep(50)
            }
        }
    } catch (e) {
        console.error(e);
    }
})

bot.action('ogon', async ctx => {
    try {
        const uid = await Number(ctx.callbackQuery.message.caption_entities[1].url.replace(/[^0-9]/g, ""));
        const db = await collection.findOne({user_id: uid})
        await collection.findOneAndUpdate({_id: new ObjectId('64901b527a931a00216404d5')}, {$push: {top: {audio: ctx.callbackQuery.message.audio.file_id, bitmar: db.bitmar}}})
        await ctx.editMessageCaption(`<b>Битмарь:</b> ${db.bitmar}\n\n<b>Оценка:</b> 🔥`, {parse_mode: 'HTML'})
        await ctx.tg.sendAudio(db.user_id, ctx.callbackQuery.message.audio.file_id, {caption: '<b>Оценка:</b> 🔥', parse_mode: 'HTML'})
        await ctx.answerCbQuery()
    } catch (e) {
       console.error(e); 
    }
})

bot.action('pref', async ctx => {
    try {
        const uid = await Number(ctx.callbackQuery.message.caption_entities[1].url.replace(/[^0-9]/g, ""));
        const db = await collection.findOne({user_id: uid})
        await collection.findOneAndUpdate({_id: new ObjectId('64901b527a931a00216404d5')}, {$push: {prf: {audio: ctx.callbackQuery.message.audio.file_id, bitmar: db.bitmar}}})
        await ctx.editMessageCaption(`<b>Битмарь:</b> ${db.bitmar}\n\n<b>Оценка:</b> 👎`, {parse_mode: 'HTML'})
        await ctx.tg.sendAudio(db.user_id, ctx.callbackQuery.message.audio.file_id, {caption: '<b>Оценка:</b> 👎', parse_mode: 'HTML'})
        await ctx.answerCbQuery()
    } catch (e) {
       console.error(e); 
    }
})

bot.action('streamwork', async ctx => {
    try {
        const uid = await Number(ctx.callbackQuery.message.caption_entities[1].url.replace(/[^0-9]/g, ""));
        const db = await collection.findOne({user_id: uid})
        await collection.findOneAndUpdate({_id: new ObjectId('64901b527a931a00216404d5')}, {$push: {rs: {audio: ctx.callbackQuery.message.audio.file_id, bitmar: db.bitmar}}})
        await ctx.editMessageCaption(`<b>Битмарь:</b> ${db.bitmar}\n\n<b>Оценка:</b> РАБОТА СТРИМА 💯`, {parse_mode: 'HTML'})
        await ctx.tg.sendAudio(db.user_id, ctx.callbackQuery.message.audio.file_id, {caption: '<b>Оценка:</b> РАБОТА СТРИМА 💯', parse_mode: 'HTML'})
        await ctx.answerCbQuery()
    } catch (e) {
       console.error(e); 
    }
})


bot.launch({dropPendingUpdates: true});
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));