const { Telegraf } = require('telegraf');
const fs = require('fs');
const Tesseract = require('tesseract.js');

const bot = new Telegraf('8168135954:AAG2R4fmeAJ2xJsCv5d0ADZPp7wxVbu4nic');

let members = require('./members.json');

function saveMembers() {
    fs.writeFileSync('./members.json', JSON.stringify(members, null, 2));
}

function checkProof(text) {
    const foundPromo = text.toLowerCase().includes('samalentips');
    const numbers = text.match(/\d+/g)?.map(Number) || [];
    const hasAmount = numbers.some(num => num >= 1000);
    return foundPromo && hasAmount;
}

bot.start((ctx) => {
    ctx.reply('Welcome to SAMALEN TIPS!\n\nSend your screenshot showing you joined with promo code "SAMALENTIPS" and deposited at least 1,000 TSH.');
});

bot.on('photo', async (ctx) => {
    const photo = ctx.message.photo.pop();
    const fileId = photo.file_id;
    const fileLink = await ctx.telegram.getFileLink(fileId);

    ctx.reply('⏳ Verifying your proof, please wait...');

    Tesseract.recognize(fileLink.href, 'eng')
        .then(({ data: { text } }) => {
            console.log('Extracted text:', text);

            if (checkProof(text)) {
                if (!members.includes(ctx.from.id)) {
                    members.push(ctx.from.id);
                    saveMembers();
                    ctx.reply('✅ Congrats! You are now verified as SAMALEN TIPS member!');
                } else {
                    ctx.reply('✅ You are already verified!');
                }
            } else {
                ctx.reply('❌ Verification failed! Please send a clear screenshot showing "SAMALENTIPS" and amount 1,000 or more.');
            }
        })
        .catch(err => {
            console.error(err);
            ctx.reply('❌ Error reading the image. Please try again.');
        });
});

bot.command('broadcast', async (ctx) => {
    const adminId = 1402434188;
    if (ctx.from.id !== adminId) {
        return ctx.reply('❌ You are not authorized to broadcast.');
    }

    const message = ctx.message.text.split(' ').slice(1).join(' ');
    if (!message) {
        return ctx.reply('❌ Please provide a message to broadcast.');
    }

    for (const memberId of members) {
        try {
            await ctx.telegram.sendMessage(memberId, `📢 SAMALEN TIPS:\n${message}`);
        } catch (err) {
            console.error(`Failed to send message to ${memberId}`, err);
        }
    }

    ctx.reply('✅ Broadcast sent to all members!');
});

bot.launch();

console.log('✅ SAMALEN TIPS BOT is running!');