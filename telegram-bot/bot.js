const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

// Bot configuration
const token = process.env.TELEGRAM_BOT_TOKEN;
const apiUrl = process.env.API_URL || 'http://localhost:5000';
const botSecretToken = process.env.BOT_SECRET_TOKEN;

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

if (!botSecretToken) {
  console.error('BOT_SECRET_TOKEN is required');
  process.exit(1);
}

// Create bot instance
const bot = new TelegramBot(token, { polling: true });

console.log('MetroUni Telegram Bot started...');

// Handle errors
bot.on('error', (error) => {
  console.error('Bot error:', error);
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

// Handle messages from the group
bot.on('message', async (msg) => {
  try {
    const chatId = msg.chat.id;
    const chatType = msg.chat.type;
    
    // Only process messages from groups/supergroups (not private chats)
    if (chatType !== 'group' && chatType !== 'supergroup') {
      return;
    }

    // Skip bot messages
    if (msg.from.is_bot) {
      return;
    }

    // Skip commands
    if (msg.text && msg.text.startsWith('/')) {
      return;
    }

    // Process text messages
    if (msg.text) {
      await forwardToAPI(msg.text, msg.from, msg.chat);
    }

    // Process photo messages with captions
    if (msg.photo && msg.caption) {
      const photoUrl = await getPhotoUrl(msg.photo[msg.photo.length - 1].file_id);
      await forwardToAPI(msg.caption, msg.from, msg.chat, [photoUrl]);
    }

    // Process document messages with captions
    if (msg.document && msg.caption) {
      const docUrl = await getDocumentUrl(msg.document.file_id);
      await forwardToAPI(msg.caption, msg.from, msg.chat, [docUrl]);
    }

  } catch (error) {
    console.error('Error processing message:', error);
  }
});

// Function to get photo URL
async function getPhotoUrl(fileId) {
  try {
    const fileInfo = await bot.getFile(fileId);
    return `https://api.telegram.org/file/bot${token}/${fileInfo.file_path}`;
  } catch (error) {
    console.error('Error getting photo URL:', error);
    return null;
  }
}

// Function to get document URL
async function getDocumentUrl(fileId) {
  try {
    const fileInfo = await bot.getFile(fileId);
    return `https://api.telegram.org/file/bot${token}/${fileInfo.file_path}`;
  } catch (error) {
    console.error('Error getting document URL:', error);
    return null;
  }
}

// Function to forward message to MetroUni API
async function forwardToAPI(content, from, chat, mediaUrls = []) {
  try {
    // Filter content to only forward university-related messages
    const universityKeywords = [
      'university', 'metro', 'class', 'lecture', 'exam', 'assignment',
      'student', 'professor', 'campus', 'library', 'registration',
      'semester', 'course', 'degree', 'graduation', 'academic',
      'announcement', 'event', 'schedule', 'deadline', 'fee'
    ];

    const contentLower = content.toLowerCase();
    const isUniversityRelated = universityKeywords.some(keyword => 
      contentLower.includes(keyword)
    );

    // Also forward messages from admin/verified channels
    const isFromAdmin = from.username && (
      from.username.includes('admin') || 
      from.username.includes('official') ||
      from.username.includes('metro')
    );

    if (!isUniversityRelated && !isFromAdmin) {
      console.log('Message not university-related, skipping:', content.substring(0, 50));
      return;
    }

    // Prepare the post content
    let postContent = content;
    
    // Add context about the source
    if (from.username) {
      postContent += `\n\n📢 From: @${from.username}`;
    } else {
      postContent += `\n\n📢 From: ${from.first_name || 'Unknown'}`;
    }

    if (chat.title) {
      postContent += ` in ${chat.title}`;
    }

    // Send to MetroUni API
    const response = await axios.post(`${apiUrl}/api/posts/bot`, {
      content: postContent,
      botToken: botSecretToken,
      mediaUrls: mediaUrls.filter(url => url !== null)
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✓ Message forwarded to MetroUni:', response.data.post.id);

  } catch (error) {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('Network Error:', error.message);
    } else {
      console.error('Forward Error:', error.message);
    }
  }
}

// Handle bot commands
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 
    '🎓 MetroUni Bot is active!\n\n' +
    'I forward university-related messages from this group to the MetroUni social network.\n\n' +
    'Commands:\n' +
    '/status - Check bot status\n' +
    '/help - Show this help message'
  );
});

bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 
    '✅ MetroUni Bot is running\n' +
    `🔗 API: ${apiUrl}\n` +
    `📅 Started: ${new Date().toLocaleString()}`
  );
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 
    '🤖 MetroUni Bot Help\n\n' +
    'This bot automatically forwards university-related messages to the MetroUni social network.\n\n' +
    'Keywords that trigger forwarding:\n' +
    '• University, Metro, Class, Lecture\n' +
    '• Exam, Assignment, Student, Professor\n' +
    '• Campus, Library, Registration\n' +
    '• Semester, Course, Academic\n' +
    '• Announcement, Event, Schedule\n\n' +
    'The bot also forwards messages from admin/official accounts.'
  );
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down MetroUni Bot...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down MetroUni Bot...');
  bot.stopPolling();
  process.exit(0);
});

console.log('Bot is ready to receive messages!');
