package com.example.utils

import android.content.Context
import android.provider.ContactsContract
import android.util.Log

object ContactsHelper {
    fun fetchContacts(context: Context): List<String> {
        val phoneNumbers = mutableListOf<String>()
        val contentResolver = context.contentResolver
        val cursor = contentResolver.query(
            ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
            arrayOf(ContactsContract.CommonDataKinds.Phone.NUMBER),
            null,
            null,
            null
        )
        cursor?.use {
            val numberIndex = it.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER)
            while (it.moveToNext()) {
                val number = it.getString(numberIndex)
                // Normalize number
                val cleanNumber = number.replace(Regex("[^+\\d]"), "")
                if (cleanNumber.isNotBlank()) {
                    phoneNumbers.add(cleanNumber)
                }
            }
        }
        return phoneNumbers.distinct()
    }
}
