const User = require("../models/User");
const bcrypt = require("bcrypt");

// Get Profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");

        res.json(user);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }
};

// Update Profile
exports.updateProfile = async (req, res) => {

    try {

        const user = await User.findByIdAndUpdate(
            req.user.id,
            req.body,
            { new: true }
        ).select("-password");

        res.json(user);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }
};

// Change Password
exports.changePassword = async (req, res) => {

    try {

        const { oldPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const isMatch = await bcrypt.compare(
            oldPassword,
            user.password
        );

        if (!isMatch) {

            return res.status(400).json({
                message: "Old password is incorrect"
            });

        }

        const hashedPassword = await bcrypt.hash(
            newPassword,
            10
        );

        user.password = hashedPassword;

        await user.save();

        res.json({
            message: "Password changed successfully"
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }
};

//upload Profile Image
exports.uploadProfileImage = async (req, res) => {

    try {

        if (!req.file) {

            return res.status(400).json({
                message: "Please upload an image"
            });

        }

        const user = await User.findById(req.user.id);

        user.profileImage = req.file.filename;

        await user.save();

        res.json({

            message: "Profile image uploaded successfully",

            profileImage: user.profileImage

        });

    } catch (err) {

        res.status(500).json({

            message: err.message

        });

    }

};

//delete account
// Delete Account
exports.deleteAccount = async (req, res) => {

    try {

        const user = await User.findById(req.user.id);

        if (!user) {

            return res.status(404).json({
                message: "User not found"
            });

        }

        await User.findByIdAndDelete(req.user.id);

        res.json({

            message: "Account deleted successfully"

        });

    }

    catch (err) {

        res.status(500).json({

            message: err.message

        });

    }

};