# WAVE-GATE
## _Turn your vinyl records into passwords (and hide them into hidden .png meta data)_
Wave-Gate is a CLI application built with Javascript which converts .wav files into encrypted passwords and hides said passwords into hidden meta data of selected .png files.

## Usage
In order to properly use Wave-Gate, the instructions are actually quite simple.

1. Place a .wav file in the assets folder. Title the file "audio".
2. Place a .png image in the assets folder. Title the file "album".
3. Launch Wave-Gate.
4. First check and make sure that no passwords are already saved to the image using the check function.
5. If no passwords are found, use the encrypt function.
6. After the encrypt function is used, run the check function again to confirm a password is saved to the .png.
7. Finally use the launch function to copy the password to your clipboard.

## Screenshots
![Screenshot of Wave-Gate's menu](https://raw.githubusercontent.com/dionhobdy/wave-gate/refs/heads/main/Read%20Me%20Assets/menu.png)

Main menu for Wave-Gate.

![Screenshot of Wave-Gate's check function](https://raw.githubusercontent.com/dionhobdy/wave-gate/refs/heads/main/Read%20Me%20Assets/check.png)

Check function used to check for passwords already stored in selected .png.

![Screenshot of Wave-Gate's encryption function](https://raw.githubusercontent.com/dionhobdy/wave-gate/refs/heads/main/Read%20Me%20Assets/encrypt.png)

Encryption function used to take the binary data of the .wav file, generate a password, encrypt the password and then finally store the password in hidden meta data of the selected .png image.

![Screenshot of Wave-Gate's launch function](https://raw.githubusercontent.com/dionhobdy/wave-gate/refs/heads/main/Read%20Me%20Assets/launch.png)

Launch function that copies the decrypted password to the user's clipboard.


## To-Do List
- [ ] Enable the user to name the .png and .wav files.
- [ ] Enable the user to select files using an in app listing system.
- [ ] Enable the user to select password bit lengths.
- [ ] Accept that the application is finished. 🥳 
