import os
import time
import threading
import tkinter as tk
from tkinter import ttk, messagebox

def human_readable_size(size, decimal_places=2):
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size < 1024.0:
            return f"{size:.{decimal_places}f} {unit}"
        size /= 1024.0
    return f"{size:.{decimal_places}f} PB"

def get_directory_size(path):
    total = 0
    for dirpath, _, filenames in os.walk(path):
        for f in filenames:
            try:
                fp = os.path.join(dirpath, f)
                if os.path.exists(fp):
                    total += os.path.getsize(fp)
            except Exception:
                continue
    return total

def launch_main_gui():
    splash.destroy()

    root = tk.Tk()
    root.title("File Explorer with Frost Theme")
    root.geometry("1000x600")

    # Theme styling
    style = ttk.Style(root)
    style.theme_use("clam")
    dark_bg = "#1e1e2f"
    frost_blue = "#6ec1e4"
    mid_blue = "#4b89ac"
    text_fg = "#d4d4dc"

    root.configure(bg=dark_bg)
    style.configure("Treeview",
        background=dark_bg,
        foreground=text_fg,
        fieldbackground=dark_bg,
        rowheight=25)
    style.map("Treeview",
        background=[("selected", mid_blue)],
        foreground=[("selected", "white")])
    style.configure("Treeview.Heading",
        background="#2c2c3a",
        foreground=frost_blue,
        font=('Segoe UI', 10, 'bold'))
    style.configure("TLabel", background=dark_bg, foreground=text_fg)
    style.configure("TFrame", background=dark_bg)
    style.configure("TProgressbar", troughcolor="#2a2a3d", background=frost_blue)

    paned_window = ttk.PanedWindow(root, orient=tk.HORIZONTAL)
    paned_window.pack(fill=tk.BOTH, expand=True)

    nav_frame = ttk.Frame(paned_window, width=300)
    
    # --- Search Bar at the Top of nav_frame ---
    search_frame = ttk.Frame(nav_frame)
    search_frame.pack(fill=tk.X, padx=5, pady=5)
    search_var = tk.StringVar()
    search_entry = ttk.Entry(search_frame, textvariable=search_var)
    search_entry.pack(side=tk.LEFT, fill=tk.X, expand=True)
    search_button = ttk.Button(search_frame, text="Search")
    search_button.pack(side=tk.LEFT, padx=(5, 0))
    # --- End Search Bar ---

    nav_tree = ttk.Treeview(nav_frame)
    nav_tree.pack(fill=tk.BOTH, expand=True)
    paned_window.add(nav_frame)

    main_frame = ttk.Frame(paned_window)
    progress_frame = ttk.Frame(main_frame)
    progress_frame.pack(fill=tk.X, padx=10, pady=(0, 5))

    progress_bar = ttk.Progressbar(progress_frame, orient="horizontal", length=600, mode="determinate")
    progress_bar.pack(side=tk.LEFT, fill=tk.X, expand=True)

    progress_label = ttk.Label(progress_frame, text="0%")
    progress_label.pack(side=tk.RIGHT, padx=(10, 0))

    current_file_label = ttk.Label(main_frame, text="Reading: ", anchor="w")
    current_file_label.pack(fill=tk.X, padx=10)

    eta_label = ttk.Label(main_frame, text="", anchor="w")
    eta_label.pack(fill=tk.X, padx=10)

    # Change main_tree to include a 'Path' column
    main_tree = ttk.Treeview(main_frame, columns=('Name', 'Type', 'Size', 'Path'), show='headings')
    sort_reverse = {'Name': False, 'Type': False, 'Size': False, 'Path': False}

    def sort_tree(col):
        sort_reverse[col] = not sort_reverse[col]
        data = [(main_tree.set(k, col), k) for k in main_tree.get_children('')]

        if col == 'Size':
            def parse_size(s):
                number, unit = s.split()
                unit_map = {'B': 0, 'KB': 1, 'MB': 2, 'GB': 3, 'TB': 4, 'PB': 5}
                return float(number) * (1024 ** unit_map[unit])
            data.sort(key=lambda t: parse_size(t[0]), reverse=sort_reverse[col])
        else:
            data.sort(key=lambda t: t[0].lower(), reverse=sort_reverse[col])

        for index, (_, k) in enumerate(data):
            main_tree.move(k, '', index)

    # Update headings and columns to fit all info
    for col, width in zip(('Name', 'Type', 'Size', 'Path'), (180, 80, 80, 500)):
        main_tree.heading(col, text=col, command=lambda c=col: sort_tree(c))
        main_tree.column(col, anchor='w', width=width)
    main_tree.pack(fill=tk.BOTH, expand=True)
    paned_window.add(main_frame)

    def populate_nav_tree(tree, parent, path):
        try:
            for item in os.listdir(path):
                abs_path = os.path.join(path, item)
                if os.path.isdir(abs_path):
                    node = tree.insert(parent, 'end', text=f"{item}/", values=[abs_path], open=False)
                    tree.insert(node, 'end')
        except (PermissionError, FileNotFoundError):
            pass

    def on_nav_open(event):
        node = nav_tree.focus()
        path = nav_tree.item(node, 'values')[0]
        if nav_tree.get_children(node):
            nav_tree.delete(*nav_tree.get_children(node))
        populate_nav_tree(nav_tree, node, path)

    def on_nav_select(event):
        selected = nav_tree.focus()
        if not selected:
            return
        path = nav_tree.item(selected, 'values')[0]
        update_main_view(path)

    def update_main_view(path):
        def worker():
            items = []
            try:
                entries = os.listdir(path)
                total = len(entries)
                start_time = time.time()
                for idx, item in enumerate(entries):
                    abs_path = os.path.join(path, item)
                    current_file_label.config(text=f"Reading: {item}")
                    if os.path.isdir(abs_path):
                        size = human_readable_size(get_directory_size(abs_path))
                        items.append((item + '/', 'Folder', size, abs_path))
                    else:
                        size = human_readable_size(os.path.getsize(abs_path))
                        ext = os.path.splitext(item)[1] or 'File'
                        items.append((item, ext, size, abs_path))

                    elapsed = time.time() - start_time
                    progress = (idx + 1) / total
                    # Show elapsed time instead of estimated time remaining
                    m, s = divmod(int(elapsed), 60)
                    eta_label.config(text=f"Elapsed time: {m}m {s}s")

                    percent = int((idx + 1) / total * 100)
                    progress_bar["value"] = percent
                    progress_label.config(text=f"{percent}%")
                    root.update_idletasks()
            except Exception as e:
                messagebox.showwarning("Error", str(e))
                return

            main_tree.delete(*main_tree.get_children())
            for name, ftype, size, full_path in items:
                main_tree.insert('', 'end', values=(name, ftype, size, full_path), tags=(full_path,))
            progress_bar["value"] = 0
            progress_label.config(text="")
            current_file_label.config(text="")
            eta_label.config(text="")

        threading.Thread(target=worker).start()

    # Helper to expand nav_tree to a given path
    def expand_nav_to_path(path):
        parts = os.path.normpath(path).split(os.sep)
        if os.name == 'nt' and ':' in parts[0]:
            prefix = parts[0] + '\\'
        else:
            prefix = os.sep
        path_accum = prefix
        parent = ''
        node = ''
        for part in parts:
            if part in (':', ''):
                continue
            path_accum = os.path.join(path_accum, part)
            found = False
            for child in nav_tree.get_children(parent):
                if nav_tree.item(child, 'text').rstrip('/\\') == part:
                    node = child
                    parent = node
                    found = True
                    break
            if not found:
                try:
                    node = nav_tree.insert(parent, 'end', text=part + '/', values=[path_accum])
                    parent = node
                    populate_nav_tree(nav_tree, node, path_accum)
                except:
                    break
        if node:
            nav_tree.selection_set(node)
            nav_tree.focus(node)
            nav_tree.see(node)

    def on_main_double_click(event):
        selected = main_tree.focus()
        if not selected:
            return
        values = main_tree.item(selected, 'values')
        if len(values) < 4:
            return
        name, ftype, size, full_path = values
        if os.path.isdir(full_path):
            update_main_view(full_path)
            expand_nav_to_path(full_path)
        else:
            # For files, go to their parent directory and select the file
            parent_dir = os.path.dirname(full_path)
            update_main_view(parent_dir)
            expand_nav_to_path(parent_dir)
            # Optionally, select the file in the main_tree
            def select_file():
                for iid in main_tree.get_children():
                    vals = main_tree.item(iid, 'values')
                    if len(vals) >= 4 and vals[3] == full_path:
                        main_tree.selection_set(iid)
                        main_tree.focus(iid)
                        main_tree.see(iid)
                        break
            root.after(500, select_file)

    nav_tree.bind('<<TreeviewOpen>>', on_nav_open)
    nav_tree.bind('<<TreeviewSelect>>', on_nav_select)
    main_tree.bind('<Double-1>', on_main_double_click)

    drives = [f"{d}:\\\\" for d in "ABCDEFGHIJKLMNOPQRSTUVWXYZ" if os.path.exists(f"{d}:\\\\")]
    for drive in drives:
        node = nav_tree.insert('', 'end', text=drive, values=[drive], open=False)
        nav_tree.insert(node, 'end')

    def search_files_worker(search_term, root_paths):
        results = []
        def walk(path):
            try:
                for entry in os.scandir(path):
                    if search_term.lower() in entry.name.lower():
                        if entry.is_dir():
                            size = human_readable_size(get_directory_size(entry.path))
                            ftype = "Folder"
                        else:
                            size = human_readable_size(entry.stat().st_size)
                            ftype = os.path.splitext(entry.name)[1] or "File"
                        results.append((entry.name, ftype, size, entry.path))
                    if entry.is_dir(follow_symlinks=False):
                        walk(entry.path)
            except Exception:
                pass

        for root_path in root_paths:
            walk(root_path)
        return results

    def on_search():
        term = search_var.get().strip()
        if not term:
            return
        root_paths = [nav_tree.item(child, 'values')[0] for child in nav_tree.get_children('')]
        main_tree.delete(*main_tree.get_children())
        progress_label.config(text="Searching...")
        progress_bar["value"] = 0
        current_file_label.config(text=f"Searching for: {term}")
        eta_label.config(text="")

        def do_search():
            start_time = time.time()
            found = search_files_worker(term, root_paths)
            elapsed = time.time() - start_time
            for name, ftype, size, full_path in found:
                main_tree.insert('', 'end', values=(name, ftype, size, full_path))
            progress_label.config(text=f"Found {len(found)} item(s) in {elapsed:.1f}s")
            progress_bar["value"] = 0
            current_file_label.config(text="")
            eta_label.config(text="")

        threading.Thread(target=do_search).start()

    search_button.config(command=on_search)
    search_entry.bind('<Return>', lambda event: on_search())

    root.mainloop()

splash = tk.Tk()
dark_bg = "#1e1e2f"
frost_blue = "#6ec1e4"
text_fg = "#d4d4dc"
splash.configure(bg=dark_bg)
splash.title("Loading...")
splash.geometry("400x200")
splash_label = tk.Label(splash, text="File Explorer", font=("Arial", 24), bg=dark_bg, fg=frost_blue)
splash_label.pack(pady=20)
splash_msg = tk.Label(splash, text="Parsing system directories...", font=("Arial", 12), bg=dark_bg, fg=text_fg)
splash_msg.pack(pady=10)
splash.after(1000, launch_main_gui)
splash.mainloop()