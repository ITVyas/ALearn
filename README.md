# ALearn
#### Author: Viacheslav Rudametkin (slavoxhkaloo@gmail.com)
## What is it?
  This is Electron-based desktop application for English words learning.
App provides some functionallity for high learning efficency:
- Storing words as set of: spelling, translations, explanations, examples
- Storing unstructured data as 'Cards'
- Remembering words through 2 types of testing: picking right option, matching words with their translations / explanations / examples
- Notifications with custom settings

## Step by step GUI and Functionallity overview

![image](https://github.com/user-attachments/assets/6cbbe17e-1408-4989-bd27-3e739b39504e)


On the image above you can see GUI. On the left, navigation bar says you have 7 sections:
- Vocabulary
- New word form
- New card form
- Testing (multiple-choice questions)
- Matching (pairing words with translations, explanations, or examples)
- Notifications
- Settings

### Vocabulary

This section stores all your Words and Cards, as shown in the image above. Here, you can view, edit, or delete records.

### New word

![image](https://github.com/user-attachments/assets/66e1e658-ce68-4533-9b6a-6e665af90ea3)

The New Word form is used to add a structured word record to your Vocabulary. You can add multiple translations, explanations, and examples. The final entry is classified as a Word and can be used in training (Testing or Matching).

To make things easier, after entering the word's spelling, two buttons ("O" and "C") appear. Clicking them will take you to the Oxford and Cambridge dictionary pages, respectively.

>[!IMPORTANT]
>You should enter spelling without any articles ('a', 'the', 'to' etc.) for two reasons.
>1. Many words have multiple meanings and grammatical roles.
>2. It prevents hints from appearing during training.

>[!NOTE]
>The Oxford and Cambridge buttons do not verify if the word exists. If the word is invalid, the dictionary will still open, but you will receive correction suggestions.

### New card

![image](https://github.com/user-attachments/assets/cb28592d-59b2-482c-bda6-835dd224abac)

The New Card form allows you to store unstructured information, such as:
- A list of words you plan to learn later.
- Phrasal verbs, grammar rules, or word groups.
- Any other custom notes.

>[!NOTE]
>Cards cannot be used in training, but they can be used as notification content (see the Notifications section).

### Testing

![image](https://github.com/user-attachments/assets/798aba9f-1e29-4866-91e1-b3b206c4be0f)
![image](https://github.com/user-attachments/assets/389cb4db-9685-40cd-a30f-d20acd9b32d9)

This is a multiple-choice question set with only one correct answer per question. The test is generated from your Words, but you can filter out words that you already know well.
There are three types of training:
- Using translations as answer options.
- Using explanations as answer options.
- Using examples as answer options.

>[!NOTE]
>If a word has multiple translations, explanations, or examples, the training mode will randomly pick one of them as an answer choice.

>[!NOTE]
>Tests are generated from your Vocabulary. If you have very few words, either:
>- The app won't be able to generate a test.
>- The test will have many repeated words and options.

 ### Matching

![image](https://github.com/user-attachments/assets/65e20d23-9a13-4e18-b7cf-01a3d695349e)

A set of questions where you match left-side options to their correct right-side counterparts. Like in Testing, you can customize:
- Number of questions.
- Number of options per question.
- Training type.
- Word filtering.

>[!NOTE]
>Word filtering applies globally to the entire app.

>[!NOTE]
>Since Matching is more complex to generate, be mindful of the settings:
>- The maximum number of questions depends on the training type.
>- The maximum number of options per question depends on the number of available words.
>- The app won't allow invalid configurations.

### Notifications

![image](https://github.com/user-attachments/assets/19f7142d-b6be-499d-a670-99541cb5dedb)

One of the app's key features. You can configure notifications to:
- Send Words or Cards as reminders.
- Apply filters for Words and Cards.
- Customize the notification frequency.

Additionally, there is an extra feature:
- A second notification containing a random B2-C1 word from The Oxford 5000™ by CEFR level.

### Settings

![image](https://github.com/user-attachments/assets/3314fa1d-4a71-4386-b1c4-f7d4a2191004)

In the Settings section, you can:
- Configure Word and Card filters.
- Enable or disable "Close to Tray" mode, which hides the app in the system tray when closed (disabled by default).

