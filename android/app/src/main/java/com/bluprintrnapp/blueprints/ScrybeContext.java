package com.bluprintrnapp.blueprints;

import android.content.Context;
import android.content.ContextWrapper;

import java.util.ArrayList;

import BpPrinter.mylibrary.Scrybe;

/**
 * BluetoothConnectivity extends android.content.Context AND requires a Scrybe in its constructor.
 * Since ReactContextBaseJavaModule is not a Context, we wrap the app Context here and
 * implement Scrybe so it can be passed to new BluetoothConnectivity(scrybeContext).
 */
public class ScrybeContext extends ContextWrapper implements Scrybe {

    public interface DiscoveryListener {
        void onDiscoveryComplete(ArrayList<String> devices);
    }

    private DiscoveryListener discoveryListener;

    public ScrybeContext(Context base) {
        super(base);
    }

    public void setDiscoveryListener(DiscoveryListener listener) {
        this.discoveryListener = listener;
    }

    @Override
    public void onDiscoveryComplete(ArrayList<String> devices) {
        if (discoveryListener != null) {
            discoveryListener.onDiscoveryComplete(devices);
        }
    }

    @Override
    public void onUsbConnected() {
        // Bluetooth only — not used
    }
}
